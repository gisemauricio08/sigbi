import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoginForm } from '../forms/login.form';
import { LoginStore } from '../store/login.store';

@Component({
  selector: 'app-login',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    FormField,
    FormRoot
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [ LoginForm, LoginStore ]
})
export class LoginComponent {

  protected readonly loginForm = inject(LoginForm);
  private readonly loginStore = inject(LoginStore);

  protected $loggingIn = this.loginStore.$loggingIn;

  protected readonly $verContrasena = signal(false);

  protected alternarContrasena() {
    this.$verContrasena.update((visible) => !visible);
  }

  login(){
    if(this.loginForm.isInvalid()) return;

    const { username, password } = this.loginForm.value();

    //Solo el correo: un espacio de más da un 401; en la contraseña puede ser parte de ella
    this.loginStore.login(username.trim(), password);
  }
}
