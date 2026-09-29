import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';
import { Reservation } from '../../model/reservation';
import { ReservationService } from '../../services/reservation.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { LayoutBreakpointService } from '../../shared/services/layout-breakpoint.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ClientStore } from '../../store/client.store';
import { ReservationStore } from '../../store/reservation.store';

//Más de tres títulos vuelven ilegible la fila: el resto va en un emergente
const TITULOS_VISIBLES = 3;

@Component({
  selector: 'app-reservation',
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    PageHeaderComponent,
  ],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css',
  providers: [ReservationStore, ClientStore],
})
export class ReservationComponent {

  private readonly reservationStore = inject(ReservationStore);
  private readonly clientStore = inject(ClientStore);
  private readonly reservationService = inject(ReservationService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);

  protected readonly $esEstrecha = inject(LayoutBreakpointService).$esEstrecha;

  protected readonly $pagina = signal({ indice: 0, tamano: 10 });

  protected readonly $reservations = this.reservationStore.$reservations;
  protected readonly $loading = this.reservationStore.$loading;
  protected readonly $error = this.reservationStore.$error;

  protected readonly dataSource = new MatTableDataSource<Reservation>();
  protected readonly $paginator = viewChild(MatPaginator);

  protected readonly displayedColumns = ['reservationDate', 'client', 'books', 'actions'];

  //Clientes navega aquí con ?cliente=<id>
  private readonly $idClienteFiltrado = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const valor = params.get('cliente');

        return valor ? Number(valor) : null;
      }),
    ),
    { initialValue: null },
  );

  //El nombre se resuelve contra el listado de clientes para poder nombrar el filtro aunque
  //ese cliente no tenga reservas
  protected readonly $clienteFiltrado = computed(() => {
    const id = this.$idClienteFiltrado();

    if (!id) return null;

    return this.clientStore.$clients().find((c) => c.idClient === id) ?? null;
  });

  protected readonly $hayFiltro = computed(() => this.$idClienteFiltrado() !== null);

  //Criterio 7 de FEAT-002: la fila que llega con ?nueva=<id> se destaca
  protected readonly $idNueva = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const valor = params.get('nueva');

        return valor ? Number(valor) : null;
      }),
    ),
    { initialValue: null },
  );

  protected readonly $enPagina = computed(() => {
    const { indice, tamano } = this.$pagina();

    return this.$reservations().slice(indice * tamano, indice * tamano + tamano);
  });

  constructor() {
    effect(() => {
      this.reservationStore.filtrarPorCliente(this.$idClienteFiltrado());
    });

    effect(() => {
      this.dataSource.data = this.$reservations();
      this.dataSource.paginator = this.$paginator() ?? null;
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

  protected cambiarPagina(evento: { pageIndex: number; pageSize: number }) {
    this.$pagina.set({ indice: evento.pageIndex, tamano: evento.pageSize });
  }

  protected titulosVisibles(reserva: Reservation) {
    return (reserva.details ?? []).slice(0, TITULOS_VISIBLES);
  }

  protected titulosRestantes(reserva: Reservation) {
    return (reserva.details ?? []).slice(TITULOS_VISIBLES);
  }

  protected nombreCliente(reserva: Reservation) {
    return reserva.client ? `${reserva.client.firstName} ${reserva.client.lastName}` : 'Cliente sin nombre';
  }

  protected quitarFiltro() {
    this.router.navigate(['/pages/reservation']);
  }

  //RN-13: eliminar devuelve los libros al catálogo, y la confirmación lo dice
  protected eliminar(reserva: Reservation) {
    const libros = reserva.details?.length ?? 0;
    const fecha = reserva.reservationDate
      ? new Date(reserva.reservationDate).toLocaleDateString('es-PE')
      : 'sin fecha';

    const data: ConfirmDialogData = {
      titulo: 'Eliminar reserva',
      mensaje: `Se eliminará la reserva del ${fecha} de ${this.nombreCliente(reserva)}.`,
      //Sin plural(): cambian también el posesivo y el verbo
      consecuencia: libros === 1
        ? 'Su libro volverá a estar disponible.'
        : `Sus ${libros} libros volverán a estar disponibles.`,
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.reservationService.delete(reserva.idReservation!)),
        tap(() => this.notificationService.notify(
          libros === 1
            ? 'Se eliminó la reserva y se liberó su libro.'
            : `Se eliminó la reserva y se liberaron ${libros} libros.`,
        )),
      )
      .subscribe(() => this.reservationStore.reload());
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.reservationStore.reload();
  }
}
