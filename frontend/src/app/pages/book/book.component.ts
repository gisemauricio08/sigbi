import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
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
import { RouterLink } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { Book } from '../../model/book';
import { BookService } from '../../services/book.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { LayoutBreakpointService } from '../../shared/services/layout-breakpoint.service';
import { NotificationService } from '../../shared/services/notification.service';
import { categoryToneClass } from '../../shared/utils/category-tone';
import { BookStore } from '../../store/book.store';
import { BookDialogComponent } from './book-dialog/book-dialog.component';

@Component({
  selector: 'app-book',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    PageHeaderComponent,
  ],
  templateUrl: './book.component.html',
  styleUrl: './book.component.css',
  providers: [BookStore],
})
export class BookComponent {

  private readonly bookStore = inject(BookStore);
  private readonly bookService = inject(BookService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);

  protected readonly $esEstrecha = inject(LayoutBreakpointService).$esEstrecha;

  protected readonly $books = this.bookStore.$books;
  protected readonly $loading = this.bookStore.$loading;
  protected readonly $error = this.bookStore.$error;
  protected readonly $categorias = this.bookStore.$categoriasPresentes;

  protected readonly $busqueda = signal('');
  protected readonly $categoriasElegidas = signal<number[]>([]);

  //Paginación de las tarjetas; la tabla pagina con MatTableDataSource y ambas comparten
  //el mismo MatPaginator
  protected readonly $pagina = signal({ indice: 0, tamano: 10 });

  protected readonly dataSource = new MatTableDataSource<Book>();
  protected readonly $paginator = viewChild(MatPaginator);
  protected readonly $sort = viewChild(MatSort);

  protected readonly displayedColumns = ['title', 'author', 'isbn', 'categoryName', 'available', 'actions'];

  //Filtrado en el cliente: el catálogo entero ya está en memoria (BookStore)
  protected readonly $filtrados = computed(() => {
    const texto = this.$busqueda().trim().toLowerCase();
    const categorias = this.$categoriasElegidas();

    return this.$books().filter((book) => {
      const casaTexto =
        !texto ||
        book.title.toLowerCase().includes(texto) ||
        book.author.toLowerCase().includes(texto);

      const casaCategoria = categorias.length === 0 || categorias.includes(book.idCategory);

      return casaTexto && casaCategoria;
    });
  });

  protected readonly $hayFiltro = computed(
    () => this.$busqueda().trim().length > 0 || this.$categoriasElegidas().length > 0,
  );

  protected readonly $enPagina = computed(() => {
    const { indice, tamano } = this.$pagina();

    return this.$filtrados().slice(indice * tamano, indice * tamano + tamano);
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.$filtrados();
      this.dataSource.paginator = this.$paginator() ?? null;
      this.dataSource.sort = this.$sort() ?? null;

      //Filtrar puede dejar al usuario en una página que ya no existe
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

  protected tono(nombre?: string) {
    return categoryToneClass(nombre);
  }

  protected buscar(evento: Event) {
    this.$busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected cambiarCategorias(evento: MatChipListboxChange) {
    this.$categoriasElegidas.set(evento.value ?? []);
  }

  protected cambiarPagina(evento: { pageIndex: number; pageSize: number }) {
    this.$pagina.set({ indice: evento.pageIndex, tamano: evento.pageSize });
  }

  protected limpiarFiltros() {
    this.$busqueda.set('');
    this.$categoriasElegidas.set([]);
  }

  protected abrirDialogo(idBook?: number) {
    this.dialog
      .open(BookDialogComponent, { width: '560px', data: idBook ?? null, disableClose: true })
      .afterClosed()
      .pipe(filter((guardado) => guardado))
      .subscribe(() => this.bookStore.reload());
  }

  protected eliminar(book: Book) {
    const data: ConfirmDialogData = {
      titulo: 'Eliminar libro',
      mensaje: `Se eliminará "${book.title}", de ${book.author}.`,
      consecuencia: book.available
        ? undefined
        : 'Este libro está reservado. Si el servidor lo rechaza, elimina antes la reserva que lo contiene.',
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.bookService.delete(book.idBook)),
        tap(() => this.notificationService.notify(`Se eliminó "${book.title}".`)),
      )
      .subscribe(() => this.bookStore.reload());
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.bookStore.reload();
  }
}
