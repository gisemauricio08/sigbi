import { Role, RoleName } from './role';

//Espejo de UserDTO
export class User {
    idUser: number;
    //El correo con el que se inicia sesión (R-8)
    username: string;
    //Un usuario no se borra, se deshabilita (R-4)
    enabled: boolean;
    roles: Role[];
}

export interface AdminUserRequest {
    email: string;
    password: string;
    roles: RoleName[];
}

//linked: la identidad ya existía en Supabase y conserva su contraseña; la del formulario no se aplica (R-10)
export interface AdminUserResponse {
    idUser: number;
    username: string;
    linked: boolean;
}

//El correo lo fija Supabase y no se edita
export interface UserUpdateRequest {
    enabled: boolean;
    roles: Pick<Role, 'name'>[];
}
