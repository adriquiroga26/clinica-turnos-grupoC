import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Medico } from "../entities/medico.entity.js";
import { EstadosUsuariosEnum } from "../../auth/enums/estados-usuarios.enum.js";
import { ListMedicoDTO } from "../dtos/output/list-medico.dto.js";
import { ActualizarValorConsultaDto } from "../dtos/input/actualizar-valor-consulta.dto.js";

@Injectable()
export class MedicosService {

    constructor(@InjectRepository(Medico) private readonly repository: Repository<Medico>) { }

    async listarMedicosActivos(): Promise<ListMedicoDTO[]> {

        const medicos = await this.repository.find({
            where: { usuario: { estado: EstadosUsuariosEnum.ACTIVO } },
            relations: { usuario: true },
            order: { id: 'ASC' },
        });

        return medicos.map((m) => {
            const dto = new ListMedicoDTO();
            dto.id = m.id;
            dto.nombres = m.usuario.nombres;
            dto.apellidos = m.usuario.apellidos;
            dto.matricula = m.matricula;
            dto.valorConsulta = m.valorConsulta;
            return dto;
        });
    }

    async obtenerMedicoPorIdUsuario(idUsuario: number): Promise<Medico | null> {

        return await this.repository.findOne({ where: { idUsuario } });
    }

    async obtenerMedicoActivoPorId(id: number): Promise<Medico | null> {

        return await this.repository.findOne({
            where: { id, usuario: { estado: EstadosUsuariosEnum.ACTIVO } },
            relations: { usuario: true },
        });
    }

    async actualizarValorConsulta(id: number, dto: ActualizarValorConsultaDto): Promise<void> {

        const medico = await this.repository.findOne({ where: { id } });

        if (!medico) {
            throw new BadRequestException('Médico no encontrado');
        }

        medico.valorConsulta = dto.valorConsulta;

        await this.repository.save(medico);
    }

}
