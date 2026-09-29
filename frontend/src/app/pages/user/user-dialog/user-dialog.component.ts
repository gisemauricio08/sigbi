import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize, Observable } from 'rxjs';
import { UserForm } from '../../../forms/user.form';
import { RoleName } from '../../../model/role';
import { AdminUserResponse, User } from '../../../model/user';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { parsearErroresDelServidor } from '../../../shared/utils/backend-errors';
import { mensajeDeErrorHttp } from '../../../shared/utils/http-error-message';
import { etiquetaDeRol } from '../../../shared/utils/role-label';
import { UserDialogStore } from '../../../store/user-dialog.store';

//Campos que el 400 del backend puede citar
const CAMPOS = ['email', 'password', 'roles', 'enabled'] as const;

//Sin usuario es un alta
export interface UserDialogData {
  user: User | null;
  //Fila de quien tiene la sesión abierta (R-6)
  esPropia: boolean;
}

@Component({
  selector: 'app-user-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.css',
  providers: [UserForm, UserDialogStore],
})
export class UserDialogComponent {

  protected readonly userForm = inject(UserForm);
  private readonly userDialogStore = inject(UserDialogStore);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<UserDialogComponent>);
  private readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  protected readonly $roles = this.userDialogStore.$roles;
  protected readonly $cargandoRoles = this.userDialogStore.$loading;
  protected readonly $errorRoles = this.userDialogStore.$error;

  protected readonly $esEdicion = computed(() => this.data.user !== null);
  protected readonly $esPropia = computed(() => this.data.esPropia);
  protected readonly $guardando = signal(false);

  protected readonly $erroresServidor = signal<Record<string, string>>({});
  protected readonly $errorGeneral = signal('');

  protected readonly $verContrasena = signal(false);

  constructor() {
    if (this.data.user) {
      this.userForm.editar(this.data.user, this.data.esPropia);
    }
  }

  protected etiqueta(rol: string) {
    return etiquetaDeRol(rol);
  }

  protected marcado(rol: RoleName) {
    return this.userForm.$model().roles.includes(rol);
  }

  //R-6: en la propia cuenta, la casilla ADMIN marcada no se puede desmarcar
  protected bloqueado(rol: RoleName) {
    return this.$esPropia() && rol === 'ADMIN' && this.marcado(rol);
  }

  protected marcarRol(rol: RoleName, marcado: boolean) {
    this.userForm.marcarRol(rol, marcado);
  }

  protected alternarContrasena() {
    this.$verContrasena.update((visible) => !visible);
  }

  protected errorDe(campo: string) {
    return this.$erroresServidor()[campo] ?? '';
  }

  protected mensajeDe(estado: { touched(): boolean; errors(): { message?: string }[] }) {
    if (!estado.touched()) return '';

    return estado.errors()[0]?.message ?? '';
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargarRoles() {
    this.userDialogStore.reload();
  }

  protected guardar() {
    if (this.userForm.isInvalid() || this.$guardando()) return;

    this.$erroresServidor.set({});
    this.$errorGeneral.set('');
    this.$guardando.set(true);

    const { email, password, roles, enabled } = this.userForm.value();
    const usuario = this.data.user;
    //Sin trim, un espacio de más crearía una cuenta inaccesible. La contraseña no se recorta.
    const correo = usuario ? usuario.username : email.trim();

    const operacion$: Observable<unknown> = usuario
      ? this.userService.updateAccess(usuario.idUser, { enabled, roles: roles.map((name) => ({ name })) })
      : this.userService.create({ email: correo, password, roles });

    //serverErrorInterceptor corta con EMPTY lo que no es un 400 de formulario: sin finalize
    //el botón quedaría bloqueado
    operacion$.pipe(finalize(() => this.$guardando.set(false))).subscribe({
      next: (respuesta) => {
        //R-10: una identidad previa de Supabase conserva su contraseña, y hay que avisarlo
        const vinculada = !usuario && (respuesta as AdminUserResponse | null)?.linked === true;

        this.notificationService.notify(
          usuario
            ? `Se actualizó la cuenta ${correo}.`
            : vinculada
              ? `La cuenta ${correo} ya existía en Supabase: se vinculó y conserva su contraseña.`
              : `Se creó la cuenta ${correo}.`,
        );
        this.dialogRef.close(true);
      },
      error: (error: HttpErrorResponse) => {
        //Errores de negocio (R-5, R-6, R-7): bajo su campo si lo nombra; si no, en el banner
        const { porCampo, general } = parsearErroresDelServidor(error, CAMPOS);

        this.$erroresServidor.set(porCampo);
        this.$errorGeneral.set(general ?? '');
      },
    });
  }

  protected cancelar() {
    this.dialogRef.close(false);
  }
}
