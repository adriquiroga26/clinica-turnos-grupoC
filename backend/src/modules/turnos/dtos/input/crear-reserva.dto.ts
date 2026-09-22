import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class CrearReservaDto {

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    idMedico!: number;

    @ApiProperty({ description: "Fecha y hora del turno (ISO 8601)" })
    @IsDateString()
    @IsNotEmpty()
    fechaHora!: string;

    @ApiProperty({ required: false, description: "Solo lo completa un administrador reservando a nombre de un paciente" })
    @IsOptional()
    @IsInt()
    idPaciente?: number;

}
