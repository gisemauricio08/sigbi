import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BookForm } from '../../../forms/book.form';
import { Book } from '../../../model/book';
import { BookService } from '../../../services/book.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { parsearErroresDelServidor } from '../../../shared/utils/backend-errors';
import { BookDialogStore } from '../../../store/book-dialog.store';
import { CategoryStore } from '../../../store/category.store';

const CAMPOS = ['title', 'author', 'isbn', 'available', 'idCategory'] as const;

@Component({
  selector: 'app-book-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './book-dialog.component.html',
  styleUrl: './book-dialog.component.css',
  providers: [BookForm, BookDialogStore, CategoryStore],
})
export class BookDialogComponent {

  protected readonly bookForm = inject(BookForm);
  private readonly bookDialogStore = inject(BookDialogStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly bookService = inject(BookService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<BookDialogComponent>);
  private readonly data = inject<number | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly $id = computed(() => (this.data ? Number(this.data) : null));
  protected readonly $esEdicion = computed(() => this.$id() !== null);
  protected readonly $guardando = signal(false);

  protected readonly $erroresServidor = signal<Record<string, string>>({});
  protected readonly $errorGeneral = signal('');

  //Solo categorías activas, más la del libro en edición aunque esté desactivada: si no,
  //guardarlo le cambiaría la categoría
  protected readonly $categorias = computed(() => {
    const activas = this.categoryStore.$activas();
    const actual = this.bookForm.$model().idCategory;

    if (!actual || activas.some((c) => c.idCategory === actual)) return activas;

    const inactiva = this.categoryStore.$categories().find((c) => c.idCategory === actual);

    return inactiva ? [inactiva, ...activas] : activas;
  });

  constructor() {
    effect(() => {
      this.bookDialogStore.setId(this.$id());
    });

    effect(() => {
      if (this.bookDialogStore.bookResource.hasValue()) {
        this.bookForm.patch(this.bookDialogStore.bookResource.value());
      }
    });
  }

  protected esActiva(idCategory: number) {
    return this.categoryStore.$activas().some((c) => c.idCategory === idCategory);
  }

  protected errorDe(campo: string) {
    return this.$erroresServidor()[campo] ?? '';
  }

  protected mensajeDe(estado: { touched(): boolean; errors(): { message?: string }[] }) {
    if (!estado.touched()) return '';

    return estado.errors()[0]?.message ?? '';
  }

  protected guardar() {
    if (this.bookForm.isInvalid() || this.$guardando()) return;

    this.$erroresServidor.set({});
    this.$errorGeneral.set('');
    this.$guardando.set(true);

    const esEdicion = this.$esEdicion();
    const book: Book = this.bookForm.value();

    const operacion$ = esEdicion
      ? this.bookService.updateWithFormErrors(this.$id()!, book)
      : this.bookService.saveWithFormErrors(book);

    operacion$.subscribe({
      next: () => {
        this.notificationService.notify(
          esEdicion ? `Se actualizó "${book.title}".` : `Se registró "${book.title}".`,
        );
        this.dialogRef.close(true);
      },
      error: (error: HttpErrorResponse) => {
        this.$guardando.set(false);

        //El ISBN duplicado llega como regla de negocio sin campo: se pinta bajo el ISBN
        const { porCampo, general } = parsearErroresDelServidor(error, CAMPOS);

        if (general && /isbn/i.test(general)) {
          porCampo['isbn'] = general;
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
