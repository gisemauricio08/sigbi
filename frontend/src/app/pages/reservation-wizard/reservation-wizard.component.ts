import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { Book } from '../../model/book';
import { Client } from '../../model/client';
import { Reservation } from '../../model/reservation';
import { ReservationService } from '../../services/reservation.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { NotificationService } from '../../shared/services/notification.service';
import { categoryToneClass } from '../../shared/utils/category-tone';
import { plural } from '../../shared/utils/plural';
import { BookStore } from '../../store/book.store';
import { ClientStore } from '../../store/client.store';

@Component({
  selector: 'app-reservation-wizard',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    PageHeaderComponent,
  ],
  templateUrl: './reservation-wizard.component.html',
  styleUrl: './reservation-wizard.component.css',
  providers: [BookStore, ClientStore],
})
export class ReservationWizardComponent {

  private readonly bookStore = inject(BookStore);
  private readonly clientStore = inject(ClientStore);
  private readonly reservationService = inject(ReservationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  private readonly $stepper = viewChild(MatStepper);

  protected readonly $cargando = computed(() => this.bookStore.$loading() || this.clientStore.$loading());
  protected readonly $error = computed(() => this.bookStore.$error() ?? this.clientStore.$error());
  protected readonly $guardando = signal(false);

  protected readonly $busquedaCliente = signal('');
  protected readonly $busquedaLibro = signal('');
  protected readonly $categoriaElegida = signal<number | null>(null);

  protected readonly $cliente = signal<Client | null>(null);
  protected readonly $libros = signal<Book[]>([]);

  protected readonly $paso = signal(0);

  protected readonly $clientesFiltrados = computed(() => {
    const texto = this.$busquedaCliente().trim().toLowerCase();

    if (!texto) return this.clientStore.$clients();

    return this.clientStore.$clients().filter(
      (cliente) =>
        cliente.firstName.toLowerCase().includes(texto) ||
        cliente.lastName.toLowerCase().includes(texto) ||
        cliente.dni.includes(texto),
    );
  });

  //RN-06: solo libros disponibles
  protected readonly $disponibles = computed(() => {
    const texto = this.$busquedaLibro().trim().toLowerCase();
    const categoria = this.$categoriaElegida();

    return this.bookStore.$books().filter((libro) => {
      if (!libro.available) return false;

      if (categoria !== null && libro.idCategory !== categoria) return false;

      return (
        !texto ||
        libro.title.toLowerCase().includes(texto) ||
        libro.author.toLowerCase().includes(texto)
      );
    });
  });

  protected readonly $categoriasDisponibles = computed(() => {
    const nombres = new Map<number, string>();

    for (const libro of this.bookStore.$books()) {
      if (libro.available && libro.idCategory && libro.categoryName) {
        nombres.set(libro.idCategory, libro.categoryName);
      }
    }

    return [...nombres].map(([idCategory, name]) => ({ idCategory, name }));
  });

  protected readonly $totalDisponibles = computed(
    () => this.bookStore.$books().filter((libro) => libro.available).length,
  );

  protected readonly $subtitulo = computed(() => {
    const titulos = ['Paso 1 de 3 - Cliente', 'Paso 2 de 3 - Selección de libros', 'Paso 3 de 3 - Confirmación'];

    return titulos[this.$paso()] ?? titulos[0];
  });

  protected tono(nombre?: string) {
    return categoryToneClass(nombre);
  }

  protected buscarCliente(evento: Event) {
    this.$busquedaCliente.set((evento.target as HTMLInputElement).value);
  }

  protected buscarLibro(evento: Event) {
    this.$busquedaLibro.set((evento.target as HTMLInputElement).value);
  }

  protected filtrarPorCategoria(idCategory: number) {
    this.$categoriaElegida.update((actual) => (actual === idCategory ? null : idCategory));
  }

  protected elegirCliente(cliente: Client) {
    this.$cliente.set(cliente);
  }

  //RN-08: un libro no se añade dos veces
  protected estaElegido(libro: Book) {
    return this.$libros().some((elegido) => elegido.idBook === libro.idBook);
  }

  protected alternarLibro(libro: Book) {
    this.$libros.update((elegidos) =>
      elegidos.some((e) => e.idBook === libro.idBook)
        ? elegidos.filter((e) => e.idBook !== libro.idBook)
        : [...elegidos, libro],
    );
  }

  protected quitarLibro(libro: Book) {
    this.$libros.update((elegidos) => elegidos.filter((e) => e.idBook !== libro.idBook));
  }

  protected cambiarPaso(indice: number) {
    this.$paso.set(indice);
  }

  //Regla 8 de FEAT-002: con una selección empezada, salir pide confirmación
  protected salir() {
    const libros = this.$libros().length;

    if (!this.$cliente() && !libros) {
      this.router.navigate(['/pages/reservation']);
      return;
    }

    const data: ConfirmDialogData = {
      titulo: 'Salir sin guardar',
      mensaje: libros
        ? `Se perderá la selección de ${plural(libros, 'libro', 'libros')} y la reserva no quedará registrada.`
        : 'Se perderá el cliente elegido y la reserva no quedará registrada.',
      textoAceptar: 'Salir sin guardar',
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) this.router.navigate(['/pages/reservation']);
      });
  }

  protected confirmar() {
    const cliente = this.$cliente();
    const libros = this.$libros();

    //RN-04. Se comprueba aunque el botón esté deshabilitado.
    if (!cliente || !libros.length || this.$guardando()) return;

    this.$guardando.set(true);

    //La fecha no se envía: la pone el servidor (RN-10)
    const reserva: Reservation = {
      idClient: cliente.idClient,
      details: libros.map((libro) => ({ idBook: libro.idBook })),
    };

    this.reservationService.saveAndGetId(reserva).subscribe({
      next: (idReservation) => {
        this.notificationService.notify(
          `Se registró la reserva de ${cliente.firstName} ${cliente.lastName} con ${plural(libros.length, 'libro', 'libros')}.`,
        );

        //Criterio 7 de FEAT-002: el listado destaca la reserva nueva
        this.router.navigate(['/pages/reservation'], {
          queryParams: idReservation ? { nueva: idReservation } : {},
        });
      },
      //Regla 7 de FEAT-002: se queda en el paso 3 con la selección intacta; el interceptor
      //ya muestra el mensaje del backend.
      error: (_error: HttpErrorResponse) => {
        this.$guardando.set(false);
      },
    });
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.bookStore.reload();
    this.clientStore.reload();
  }
}
