import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ClientForm } from '../../../forms/client.form';
import { Client } from '../../../model/client';
import { ClientService } from '../../../services/client.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { parsearErroresDelServidor } from '../../../shared/utils/backend-errors';
import { ClientDialogStore } from '../../../store/client-dialog.store';

const CAMPOS = ['firstName', 'lastName', 'dni', 'email'] as const;

@Component({
  selector: 'app-client-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './client-dialog.component.html',
  styleUrl: './client-dialog.component.css',
  providers: [ClientForm, ClientDialogStore],
})
export class ClientDialogComponent {

  protected readonly clientForm = inject(ClientForm);
  private readonly clientDialogStore = inject(ClientDialogStore);
  private readonly clientService = inject(ClientService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<ClientDialogComponent>);
  private readonly data = inject<number | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly $id = computed(() => (this.data ? Number(this.data) : null));
  protected readonly $esEdicion = computed(() => this.$id() !== null);
  protected readonly $guardando = signal(false);

  protected readonly $erroresServidor = signal<Record<string, string>>({});
  protected readonly $errorGeneral = signal('');

  constructor() {
    effect(() => {
      this.clientDialogStore.setId(this.$id());
    });

    effect(() => {
      if (this.clientDialogStore.clientResource.hasValue()) {
        this.clientForm.patch(this.clientDialogStore.clientResource.value());
      }
    });
  }

  protected errorDe(campo: string) {
    return this.$erroresServidor()[campo] ?? '';
  }

  protected mensajeDe(estado: { touched(): boolean; errors(): { message?: string }[] }) {
    if (!estado.touched()) return '';

    return estado.errors()[0]?.message ?? '';
  }

  protected guardar() {
    if (this.clientForm.isInvalid() || this.$guardando()) return;

    this.$erroresServidor.set({});
    this.$errorGeneral.set('');
    this.$guardando.set(true);

    const esEdicion = this.$esEdicion();
    const cliente: Client = this.clientForm.value();
    const nombre = `${cliente.firstName} ${cliente.lastName}`;

    const operacion$ = esEdicion
      ? this.clientService.updateWithFormErrors(this.$id()!, cliente)
      : this.clientService.saveWithFormErrors(cliente);

    operacion$.subscribe({
      next: () => {
        this.notificationService.notify(
          esEdicion ? `Se actualizó a ${nombre}.` : `Se registró a ${nombre}.`,
        );
        this.dialogRef.close(true);
      },
      error: (error: HttpErrorResponse) => {
        this.$guardando.set(false);

        const { porCampo, general } = parsearErroresDelServidor(error, CAMPOS);

        //El documento repetido llega sin campo. Se reconocen el rótulo actual, el anterior y el
        //identificador porque el backend puede ser de una versión anterior.
        if (general && /documento|c[eé]dula|dni/i.test(general)) {
          porCampo['dni'] = general;
          this.$erroresServidor.set(porCampo);
          return;
        }

        this.$erroresServidor.set(porCampo);
        this.$errorGeneral.set(general ?? '');
      },
    });
  }

  protected cancelar() {
    this.dialogRef.close(false);
  }
}
