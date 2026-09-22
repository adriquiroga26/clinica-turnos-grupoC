import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Medico } from "./entities/medico.entity.js";
import { Reserva } from "./entities/reserva.entity.js";
import { MedicosController } from "./controllers/medicos.controller.js";
import { ReservasController } from "./controllers/reservas.controller.js";
import { MedicosService } from "./services/medicos.service.js";
import { ReservasService } from "./services/reservas.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
    imports: [TypeOrmModule.forFeature([Medico, Reserva]), AuthModule],
    controllers: [MedicosController, ReservasController],
    providers: [MedicosService, ReservasService],
    exports: []
})
export class TurnosModule {

}
