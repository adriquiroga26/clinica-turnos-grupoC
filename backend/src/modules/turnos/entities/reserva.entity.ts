import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Medico } from "./medico.entity.js";
import type { Usuario } from "../../auth/entities/usuario.entity.js";
import { EstadosReservasEnum } from "../enums/estados-reservas.enum.js";

@Entity({ name: "reservas" })
export class Reserva {

    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "id_medico" })
    idMedico: number

    @ManyToOne("Medico")
    @JoinColumn({ name: "id_medico" })
    medico: Medico

    @Column({ name: "id_paciente" })
    idPaciente: number

    @ManyToOne("Usuario")
    @JoinColumn({ name: "id_paciente" })
    paciente: Usuario

    @Column({ name: "fecha_hora" })
    fechaHora: Date

    @Column({ type: "enum", enum: EstadosReservasEnum })
    estado: EstadosReservasEnum

    @Column({ name: "valor_consulta" })
    valorConsulta: number

}
