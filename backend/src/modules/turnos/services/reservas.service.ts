import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { Reserva } from "../entities/reserva.entity.js";
import { EstadosReservasEnum } from "../enums/estados-reservas.enum.js";
import { CrearReservaDto } from "../dtos/input/crear-reserva.dto.js";
import { ListReservaDTO } from "../dtos/output/list-reserva.dto.js";
import { MedicoResumenDTO } from "../dtos/output/medico-resumen.dto.js";
import { PacienteResumenDTO } from "../dtos/output/paciente-resumen.dto.js";
import { MedicosService } from "./medicos.service.js";
import { UsuariosService } from "../../auth/services/usuarios.service.js";
import { RolesUsuariosEnum } from "../../auth/enums/roles-usuarios.enum.js";
import type { UsuarioToken } from "../../auth/decorators/usuario-actual.decorator.js";

const HORA_APERTURA = 8;
const HORA_CIERRE = 16;
const DIAS_MAXIMOS_ANTICIPACION = 30;

@Injectable()
export class ReservasService {

    constructor(
        @InjectRepository(Reserva) private readonly repository: Repository<Reserva>,
        private readonly medicosService: MedicosService,
        private readonly usuariosService: UsuariosService,
    ) { }

    async crearReserva(dto: CrearReservaDto, usuarioActual: UsuarioToken): Promise<{ id: number }> {

        const fechaHora = new Date(dto.fechaHora);
        this.validarHorarioDeAtencion(fechaHora);
        this.validarAnticipacion(fechaHora);

        const medico = await this.medicosService.obtenerMedicoActivoPorId(dto.idMedico);
        if (!medico) {
            throw new BadRequestException('Se debe indicar un médico activo');
        }

        const idPaciente = await this.resolverIdPaciente(dto, usuarioActual);

        const ocupado = await this.repository.exists({
            where: {
                idMedico: medico.id,
                fechaHora,
                estado: EstadosReservasEnum.ACTIVO,
            },
        });

        if (ocupado) {
            throw new BadRequestException('El horario seleccionado ya está ocupado');
        }

        const reserva = this.repository.create({
            idMedico: medico.id,
            idPaciente,
            fechaHora,
            estado: EstadosReservasEnum.ACTIVO,
            valorConsulta: medico.valorConsulta, // se congela el valor al momento de la reserva
        });

        await this.repository.save(reserva);

        return { id: reserva.id };
    }

    async listarComoPaciente(idPaciente: number): Promise<ListReservaDTO[]> {

        const reservas = await this.repository.find({
            where: { idPaciente },
            relations: { medico: { usuario: true }, paciente: true },
            order: { fechaHora: 'DESC' },
        });

        return reservas.map((r) => this.aDTO(r));
    }

    async listarComoMedico(idUsuarioMedico: number, fecha: string): Promise<ListReservaDTO[]> {

        const medico = await this.medicosService.obtenerMedicoPorIdUsuario(idUsuarioMedico);
        if (!medico) {
            throw new BadRequestException('El usuario logueado no tiene un perfil de médico asociado');
        }

        const inicioDelDia = new Date(`${fecha}T00:00:00`);
        const finDelDia = new Date(`${fecha}T23:59:59.999`);

        const reservas = await this.repository.find({
            where: { idMedico: medico.id, fechaHora: Between(inicioDelDia, finDelDia) },
            relations: { medico: { usuario: true }, paciente: true },
            order: { fechaHora: 'ASC' },
        });

        return reservas.map((r) => this.aDTO(r));
    }

    async listarTodas(): Promise<ListReservaDTO[]> {

        const reservas = await this.repository.find({
            relations: { medico: { usuario: true }, paciente: true },
            order: { fechaHora: 'DESC' },
        });

        return reservas.map((r) => this.aDTO(r));
    }

    async cancelarComoPaciente(id: number, idPaciente: number): Promise<void> {

        const reserva = await this.obtenerReservaActiva(id);

        if (reserva.idPaciente !== idPaciente) {
            throw new ForbiddenException('No puede cancelar un turno que no es suyo');
        }

        const hoy = this.soloFecha(new Date());
        const diaDelTurno = this.soloFecha(reserva.fechaHora);

        if (hoy.getTime() >= diaDelTurno.getTime()) {
            throw new BadRequestException('Solo se puede cancelar hasta el día anterior a la consulta');
        }

        reserva.estado = EstadosReservasEnum.CANCELADO;
        await this.repository.save(reserva);
    }

    async cancelarComoAdministrador(id: number): Promise<void> {

        const reserva = await this.obtenerReservaActiva(id);

        if (new Date().getTime() >= reserva.fechaHora.getTime()) {
            throw new BadRequestException('No se puede cancelar una consulta que ya inició');
        }

        reserva.estado = EstadosReservasEnum.CANCELADO;
        await this.repository.save(reserva);
    }

    async marcarAtendido(id: number, idUsuarioMedico: number): Promise<void> {

        await this.cambiarEstadoComoMedico(id, idUsuarioMedico, EstadosReservasEnum.ATENDIDO);
    }

    async marcarAusente(id: number, idUsuarioMedico: number): Promise<void> {

        await this.cambiarEstadoComoMedico(id, idUsuarioMedico, EstadosReservasEnum.AUSENTE);
    }

    private async cambiarEstadoComoMedico(id: number, idUsuarioMedico: number, estado: EstadosReservasEnum): Promise<void> {

        const medico = await this.medicosService.obtenerMedicoPorIdUsuario(idUsuarioMedico);
        if (!medico) {
            throw new BadRequestException('El usuario logueado no tiene un perfil de médico asociado');
        }

        const reserva = await this.obtenerReservaActiva(id);

        if (reserva.idMedico !== medico.id) {
            throw new ForbiddenException('No puede modificar un turno que no es suyo');
        }

        reserva.estado = estado;
        await this.repository.save(reserva);
    }

    private async resolverIdPaciente(dto: CrearReservaDto, usuarioActual: UsuarioToken): Promise<number> {

        if (usuarioActual.rol === RolesUsuariosEnum.PACIENTE) {
            return usuarioActual.sub;
        }

        if (!dto.idPaciente) {
            throw new BadRequestException('Se debe indicar el paciente para el cual se reserva el turno');
        }

        const paciente = await this.usuariosService.buscarUsuarioActivoPorId(dto.idPaciente);
        if (!paciente || paciente.rol !== RolesUsuariosEnum.PACIENTE) {
            throw new BadRequestException('Se debe indicar un paciente activo válido');
        }

        return paciente.id;
    }

    private async obtenerReservaActiva(id: number): Promise<Reserva> {

        const reserva = await this.repository.findOne({ where: { id } });

        if (!reserva) {
            throw new BadRequestException('Turno no encontrado');
        }

        if (reserva.estado !== EstadosReservasEnum.ACTIVO) {
            throw new BadRequestException('El turno ya fue atendido, marcado ausente o cancelado');
        }

        return reserva;
    }

    private validarHorarioDeAtencion(fechaHora: Date): void {

        if (fechaHora.getMinutes() !== 0 || fechaHora.getSeconds() !== 0) {
            throw new BadRequestException('Los turnos comienzan en punto (ej: 09:00, 10:00)');
        }

        const hora = fechaHora.getHours();
        if (hora < HORA_APERTURA || hora >= HORA_CIERRE) {
            throw new BadRequestException(`El horario de atención es de ${HORA_APERTURA}hs a ${HORA_CIERRE}hs`);
        }
    }

    private validarAnticipacion(fechaHora: Date): void {

        const ahora = new Date();
        if (fechaHora.getTime() <= ahora.getTime()) {
            throw new BadRequestException('No se puede reservar un turno en el pasado');
        }

        const maximo = new Date();
        maximo.setDate(maximo.getDate() + DIAS_MAXIMOS_ANTICIPACION);
        if (fechaHora.getTime() > maximo.getTime()) {
            throw new BadRequestException(`Las reservas se pueden realizar con un máximo de ${DIAS_MAXIMOS_ANTICIPACION} días de anticipación`);
        }
    }

    private soloFecha(fecha: Date): Date {
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    }

    private aDTO(reserva: Reserva): ListReservaDTO {

        const dto = new ListReservaDTO();
        dto.id = reserva.id;
        dto.fechaHora = reserva.fechaHora;
        dto.estado = reserva.estado;
        dto.valorConsulta = reserva.valorConsulta;

        dto.medico = new MedicoResumenDTO();
        dto.medico.id = reserva.medico.id;
        dto.medico.nombres = reserva.medico.usuario.nombres;
        dto.medico.apellidos = reserva.medico.usuario.apellidos;
        dto.medico.matricula = reserva.medico.matricula;

        dto.paciente = new PacienteResumenDTO();
        dto.paciente.id = reserva.paciente.id;
        dto.paciente.nombres = reserva.paciente.nombres;
        dto.paciente.apellidos = reserva.paciente.apellidos;
        dto.paciente.documento = reserva.paciente.documento;

        return dto;
    }

}
