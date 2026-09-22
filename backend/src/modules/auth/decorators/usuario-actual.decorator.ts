import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RolesUsuariosEnum } from "../enums/roles-usuarios.enum.js";

export interface UsuarioToken {
    documento: string;
    sub: number;
    rol: RolesUsuariosEnum;
}

export const UsuarioActual = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UsuarioToken => {
        const request = ctx.switchToHttp().getRequest();
        return request['usuario'];
    },
);
