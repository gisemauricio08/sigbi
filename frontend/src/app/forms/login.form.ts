import { Service, signal } from "@angular/core";
import { email, form, minLength, required } from "@angular/forms/signals";
import { ILoginRequest } from "../model/login-request";

const emptyLogin = (): ILoginRequest => ({
    username: '',
    password: '',
});

//Provisto por el componente: cada visita a la pantalla arranca en blanco
@Service({autoProvided: false})
export class LoginForm {

    readonly $model = signal<ILoginRequest>(emptyLogin());

    readonly $form = form(this.$model, (path) => {
        required(path.username);
        email(path.username);

        required(path.password);
        minLength(path.password, 3);
    });

    readonly isInvalid = () => this.$form().invalid();

    value(){
        return this.$model();
    }

    reset(){
        this.$model.set(emptyLogin());
    }
}
