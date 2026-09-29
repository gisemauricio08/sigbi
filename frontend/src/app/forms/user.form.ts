import { Service, signal } from "@angular/core";
import { applyWhen, disabled, email, form, maxLength, minLength, readonly, required } from "@angular/forms/signals";
import { RoleName } from "../model/role";
import { User } from "../model/user";

//No es User: el alta lleva contraseña y la edición no manda el correo.
interface UserFormModel {
    email: string;
    password: string;
    roles: RoleName[];
    enabled: boolean;
}

const usuarioVacio = (): UserFormModel => ({
    email: '',
    password: '',
    roles: [],
    enabled: true,
});

@Service({autoProvided: false})
export class UserForm {

    readonly $esEdicion = signal(false);
    //R-6: la propia cuenta no puede desactivarse
    readonly $esPropia = signal(false);

    readonly $model = signal<UserFormModel>(usuarioVacio());

    readonly $form = form(this.$model, (path) => {
        //Solo en el alta: al editar, el correo lo fija Supabase y la contraseña no se toca
        applyWhen(path, () => !this.$esEdicion(), (alta) => {
            required(alta.email, { message: 'El correo es obligatorio' });
            email(alta.email, { message: 'El correo no tiene un formato válido' });
            maxLength(alta.email, 60, { message: 'Como máximo 60 caracteres' });

            required(alta.password, { message: 'La contraseña es obligatoria' });
            minLength(alta.password, 6, { message: 'Al menos 6 caracteres' });
            maxLength(alta.password, 60, { message: 'Como máximo 60 caracteres' });
        });

        readonly(path.email, () => this.$esEdicion());
        disabled(path.enabled, () => this.$esPropia());

        //R-7
        minLength(path.roles, 1, { message: 'Marca al menos un rol' });
    });

    readonly isInvalid = () => this.$form().invalid();

    editar(user: User, esPropia: boolean){
        this.$esEdicion.set(true);
        this.$esPropia.set(esPropia);
        this.$model.set({
            email: user.username,
            password: '',
            roles: user.roles.map((rol) => rol.name),
            enabled: user.enabled,
        });
    }

    //Sin [formField]: el valor es la lista de roles marcados, no un booleano por casilla
    marcarRol(rol: RoleName, marcado: boolean){
        this.$model.update((actual) => ({
            ...actual,
            roles: marcado
                ? [...actual.roles.filter((r) => r !== rol), rol]
                : actual.roles.filter((r) => r !== rol),
        }));
        this.$form.roles().markAsTouched();
    }

    value(){
        return this.$model();
    }

    reset(){
        this.$esEdicion.set(false);
        this.$esPropia.set(false);
        this.$model.set(usuarioVacio());
    }
}
