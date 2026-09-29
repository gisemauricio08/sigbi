import { Service } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { AdminUserRequest, AdminUserResponse, User, UserUpdateRequest } from '../model/user';
import { contextoDeFormulario } from '../shared/http/form-error.context';
import { GenericService } from './generic.service';

//El alta va a /v1/admin/users (crea también la identidad en Supabase). save y delete
//heredados no existen en el backend (R-4).
@Service()
export class UserService extends GenericService<User> {

    protected override url = `${environment.HOST}/v1/users`;
    private readonly adminUrl = `${environment.HOST}/v1/admin/users`;

    //Devuelven el 400 al diálogo: correo repetido, R-5, R-6 y R-7 se pintan en su sitio
    create(request: AdminUserRequest){
        return this.http.post<AdminUserResponse>(this.adminUrl, request, { context: contextoDeFormulario() });
    }

    updateAccess(id: number, request: UserUpdateRequest){
        return this.http.put<User>(`${this.url}/${id}`, request, { context: contextoDeFormulario() });
    }
}
