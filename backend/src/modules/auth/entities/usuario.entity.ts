import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EstadosUsuariosEnum } from "../enums/estados-usuarios.enum.js";
import { RolesUsuariosEnum } from "../enums/roles-usuarios.enum.js";

@Entity({ name: "usuarios" })
export class Usuario {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    documento: string

    @Column()
    apellidos: string

    @Column()
    nombres: string

    @Column()
    email: string

    @Column()
    clave: string

    @Column({ type: "enum", enum: EstadosUsuariosEnum })
    estado: EstadosUsuariosEnum

    @Column({ type: "enum", enum: RolesUsuariosEnum })
    rol: RolesUsuariosEnum

}
