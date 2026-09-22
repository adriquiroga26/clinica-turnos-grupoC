import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class ActualizarValorConsultaDto {

    @ApiProperty()
    @IsInt()
    @Min(0)
    @IsNotEmpty()
    valorConsulta!: number;

}
