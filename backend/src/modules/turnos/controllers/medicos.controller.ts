import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { MedicosService } from "../services/medicos.service.js";
import { ListMedicoDTO } from "../dtos/output/list-medico.dto.js";
import { ActualizarValorConsultaDto } from "../dtos/input/actualizar-valor-consulta.dto.js";
import { AuthGuard } from "../../auth/guards/auth.guard.js";
import { RolesGuard } from "../../auth/guards/roles.guard.js";
import { Roles } from "../../auth/decorators/roles.decorator.js";
import { RolesUsuariosEnum } from "../../auth/enums/roles-usuarios.enum.js";

@Controller('medicos')
export class MedicosController {

    constructor(private readonly service: MedicosService) { }

    @ApiBearerAuth()
    @ApiOkResponse({ type: ListMedicoDTO, isArray: true })
    @Roles(RolesUsuariosEnum.PACIENTE, RolesUsuariosEnum.ADMINISTRADOR)
    @UseGuards(AuthGuard, RolesGuard)
    @Get()
    async listarMedicos(): Promise<ListMedicoDTO[]> {

        return await this.service.listarMedicosActivos();
    }

    @ApiBearerAuth()
    @Roles(RolesUsuariosEnum.ADMINISTRADOR)
    @UseGuards(AuthGuard, RolesGuard)
    @Put(':id/valor-consulta')
    async actualizarValorConsulta(@Param('id') id: number, @Body() dto: ActualizarValorConsultaDto): Promise<void> {

        await this.service.actualizarValorConsulta(id, dto);
    }

}
