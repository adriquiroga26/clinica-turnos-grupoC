import { SetMetadata } from "@nestjs/common";
import { RolesUsuariosEnum } from "../enums/roles-usuarios.enum.js";

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolesUsuariosEnum[]) => SetMetadata(ROLES_KEY, roles);
