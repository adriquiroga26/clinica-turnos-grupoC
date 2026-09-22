import { ApiProperty } from "@nestjs/swagger";
import { EstadosReservasEnum } from "../../enums/estados-reservas.enum.js";
import { MedicoResumenDTO } from "./medico-resumen.dto.js";
import { PacienteResumenDTO } from "./paciente-resumen.dto.js";

export class ListReservaDTO {

    @ApiProperty()
    id!: number;

    @ApiProperty()
    fechaHora!: Date;

    @ApiProperty()
    estado!: EstadosReservasEnum;

    @ApiProperty()
    valorConsulta!: number;

    @ApiProperty()
    medico!: MedicoResumenDTO;

    @ApiProperty()
    paciente!: PacienteResumenDTO;

}
