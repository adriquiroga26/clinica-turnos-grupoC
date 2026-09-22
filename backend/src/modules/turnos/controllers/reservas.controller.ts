import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from "@nestjs/swagger";
import { ReservasService } from "../services/reservas.service.js";
import { CrearReservaDto } from "../dtos/input/crear-reserva.dto.js";
import { ListReservaDTO } from "../dtos/output/list-reserva.dto.js";
import { AuthGuard } from "../../auth/guards/auth.guard.js";
import { RolesGuard } from "../../auth/guards/roles.guard.js";
import { Roles } from "../../auth/decorators/roles.decorator.js";
import { RolesUsuariosEnum } from "../../auth/enums/roles-usuarios.enum.js";
import { UsuarioActual, type UsuarioToken } from "../../auth/decorators/usuario-actual.decorator.js";

@Controller('reservas')
export class ReservasController {

    constructor(private readonly service: ReservasService) { }

    @ApiBearerAuth()
    @Roles(RolesUsuariosEnum.PACIENTE, RolesUsuariosEnum.ADMINISTRADOR)
    @UseGuards(AuthGuard, RolesGuard)
    @Post()
    async crearReserva(@Body() dto: CrearReservaDto, @UsuarioActual() usuario: UsuarioToken): Promise<{ id: number }> {

        return await this.service.crearReserva(dto, usuario);
    }

    @ApiBearerAuth()
    @ApiOkResponse({ type: ListReservaDTO, isArray: true })
    @ApiQuery({ name: 'fecha', required: false, description: 'Requerido para el rol MEDICO (formato YYYY-MM-DD)' })
    @Roles(RolesUsuariosEnum.MEDICO, RolesUsuariosEnum.PACIENTE, RolesUsuariosEnum.ADMINISTRADOR)
    @UseGuards(AuthGuard, RolesGuard)
    @Get()
    async listarReservas(@UsuarioActual() usuario: UsuarioToken, @Query('fecha') fecha?: string): Promise<ListReservaDTO[]> {

        if (usuario.rol === RolesUsuariosEnum.MEDICO) {
            if (!fecha) {
                throw new BadRequestException('Se debe indicar la fecha (YYYY-MM-DD)');
            }
            return await this.service.listarComoMedico(usuario.sub, fecha);
        }

        if (usuario.rol === RolesUsuariosEnum.PACIENTE) {
            return await this.service.listarComoPaciente(usuario.sub);
        }

        return await this.service.listarTodas();
    }

    @ApiBearerAuth()
    @Roles(RolesUsuariosEnum.PACIENTE, RolesUsuariosEnum.ADMINISTRADOR)
    @UseGuards(AuthGuard, RolesGuard)
    @Put(':id/cancelar')
    async cancelarReserva(@Param('id') id: number, @UsuarioActual() usuario: UsuarioToken): Promise<void> {

        if (usuario.rol === RolesUsuariosEnum.PACIENTE) {
            await this.service.cancelarComoPaciente(id, usuario.sub);
            return;
        }

        await this.service.cancelarComoAdministrador(id);
    }

    @ApiBearerAuth()
    @Roles(RolesUsuariosEnum.MEDICO)
    @UseGuards(AuthGuard, RolesGuard)
    @Put(':id/atendido')
    async marcarAtendido(@Param('id') id: number, @UsuarioActual() usuario: UsuarioToken): Promise<void> {

        await this.service.marcarAtendido(id, usuario.sub);
    }

    @ApiBearerAuth()
    @Roles(RolesUsuariosEnum.MEDICO)
    @UseGuards(AuthGuard, RolesGuard)
    @Put(':id/ausente')
    async marcarAusente(@Param('id') id: number, @UsuarioActual() usuario: UsuarioToken): Promise<void> {

        await this.service.marcarAusente(id, usuario.sub);
    }

}
