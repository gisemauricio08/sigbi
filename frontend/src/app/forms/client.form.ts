import { Service, signal } from "@angular/core";
import { email, form, maxLength, pattern, required } from "@angular/forms/signals";
import { Client } from "../model/client";

const clienteVacio = (): Client => ({
    idClient: null,
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
});

@Service({autoProvided: false})
export class ClientForm {

    readonly $model = signal<Client>(clienteVacio());

    readonly $form = form(this.$model, (path) => {
        required(path.firstName, { message: 'Los nombres son obligatorios' });
        maxLength(path.firstName, 70, { message: 'Como máximo 70 caracteres' });

        required(path.lastName, { message: 'Los apellidos son obligatorios' });
        maxLength(path.lastName, 70, { message: 'Como máximo 70 caracteres' });

        //"Documento" en pantalla: ClientDTO exige exactamente 8 dígitos
        required(path.dni, { message: 'El documento es obligatorio' });
        pattern(path.dni, /^\d{8}$/, { message: 'El documento debe tener 8 dígitos' });

        required(path.email, { message: 'El correo es obligatorio' });
        email(path.email, { message: 'El correo no tiene un formato válido' });
        maxLength(path.email, 55, { message: 'Como máximo 55 caracteres' });
  });

  readonly isInvalid = () => this.$form().invalid();

  patch(client: Client){
    this.$model.set({ ...client });
  }

  value(){
    return this.$model();
  }

  reset(){
    this.$model.set(clienteVacio());
  }
}
