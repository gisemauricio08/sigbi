import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { Client } from '../../model/client';
import { ClientService } from '../../services/client.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { LayoutBreakpointService } from '../../shared/services/layout-breakpoint.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ClientStore } from '../../store/client.store';
import { ClientDialogComponent } from './client-dialog/client-dialog.component';

@Component({
  selector: 'app-client',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css',
  providers: [ClientStore],
})
export class ClientComponent {

  private readonly clientStore = inject(ClientStore);
  private readonly clientService = inject(ClientService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);

  protected readonly $clients = this.clientStore.$clients;
  protected readonly $loading = this.clientStore.$loading;
  protected readonly $error = this.clientStore.$error;

  protected readonly $esEstrecha = inject(LayoutBreakpointService).$esEstrecha;

  protected readonly $busqueda = signal('');

  //Paginación de las tarjetas; la tabla pagina con MatTableDataSource
  protected readonly $pagina = signal({ indice: 0, tamano: 10 });

  protected readonly dataSource = new MatTableDataSource<Client>();
  protected readonly $paginator = viewChild(MatPaginator);
  protected readonly $sort = viewChild(MatSort);

  protected readonly displayedColumns = ['firstName', 'lastName', 'dni', 'email', 'actions'];

  protected readonly $filtrados = computed(() => {
    const texto = this.$busqueda().trim().toLowerCase();

    if (!texto) return this.$clients();

    return this.$clients().filter(
      (cliente) =>
        cliente.firstName.toLowerCase().includes(texto) ||
        cliente.lastName.toLowerCase().includes(texto) ||
        cliente.dni.includes(texto) ||
        cliente.email.toLowerCase().includes(texto),
    );
  });

  protected readonly $enPagina = computed(() => {
    const { indice, tamano } = this.$pagina();

    return this.$filtrados().slice(indice * tamano, indice * tamano + tamano);
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.$filtrados();
      this.dataSource.paginator = this.$paginator() ?? null;
      this.dataSource.sort = this.$sort() ?? null;
      this.$paginator()?.firstPage();
      this.$pagina.update((actual) => ({ ...actual, indice: 0 }));
    });

    effect(() => {
      const mensaje = this.notificationService.$message();

      if (mensaje) {
        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'left',
          verticalPosition: 'bottom',
        });
        this.notificationService.clear();
      }
    });
  }

  protected buscar(evento: Event) {
    this.$busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected cambiarPagina(evento: { pageIndex: number; pageSize: number }) {
    this.$pagina.set({ indice: evento.pageIndex, tamano: evento.pageSize });
  }

  protected limpiarFiltros() {
    this.$busqueda.set('');
  }

  protected abrirDialogo(idClient?: number) {
    this.dialog
      .open(ClientDialogComponent, { width: '560px', data: idClient ?? null, disableClose: true })
      .afterClosed()
      .pipe(filter((guardado) => guardado))
      .subscribe(() => this.clientStore.reload());
  }

  protected verReservas(cliente: Client) {
    this.router.navigate(['/pages/reservation'], { queryParams: { cliente: cliente.idClient } });
  }

  //Un cliente con reservas no se elimina: lo comprueba el servidor
  protected eliminar(cliente: Client) {
    const data: ConfirmDialogData = {
      titulo: 'Eliminar cliente',
      mensaje: `Se eliminará a ${cliente.firstName} ${cliente.lastName}, documento ${cliente.dni}.`,
      consecuencia: 'Si tiene reservas registradas, el servidor rechazará la eliminación.',
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.clientService.delete(cliente.idClient)),
        tap(() => this.notificationService.notify(`Se eliminó a ${cliente.firstName} ${cliente.lastName}.`)),
      )
      .subscribe(() => this.clientStore.reload());
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.clientStore.reload();
  }
}
