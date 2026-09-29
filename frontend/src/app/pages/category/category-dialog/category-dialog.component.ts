import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoryForm } from '../../../forms/category.form';
import { Category } from '../../../model/category';
import { CategoryService } from '../../../services/category.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { parsearErroresDelServidor } from '../../../shared/utils/backend-errors';
import { CategoryDialogStore } from '../../../store/category-dialog.store';

const CAMPOS = ['name', 'description', 'status'] as const;

@Component({
  selector: 'app-category-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './category-dialog.component.html',
  styleUrl: './category-dialog.component.css',
  providers: [CategoryForm, CategoryDialogStore],
})
export class CategoryDialogComponent {

  protected readonly categoryForm = inject(CategoryForm);
  private readonly categoryDialogStore = inject(CategoryDialogStore);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private readonly data = inject<number | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly $id = computed(() => (this.data ? Number(this.data) : null));
  protected readonly $esEdicion = computed(() => this.$id() !== null);
  protected readonly $guardando = signal(false);

  protected readonly $erroresServidor = signal<Record<string, string>>({});
  protected readonly $errorGeneral = signal('');

  //Desactivar no desclasifica sus libros: solo deja de ofrecerse en el formulario de libro
  protected readonly $librosClasificados = computed(
    () => this.categoryDialogStore.categoryResource.value()?.bookCount ?? 0,
  );

  constructor() {
    effect(() => {
      this.categoryDialogStore.setId(this.$id());
    });

    effect(() => {
      if (this.categoryDialogStore.categoryResource.hasValue()) {
        this.categoryForm.patch(this.categoryDialogStore.categoryResource.value());
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
    if (this.categoryForm.isInvalid() || this.$guardando()) return;

    this.$erroresServidor.set({});
    this.$errorGeneral.set('');
    this.$guardando.set(true);

    const esEdicion = this.$esEdicion();
    const categoria: Category = this.categoryForm.value();

    const operacion$ = esEdicion
      ? this.categoryService.updateWithFormErrors(this.$id()!, categoria)
      : this.categoryService.saveWithFormErrors(categoria);

    operacion$.subscribe({
      next: () => {
        this.notificationService.notify(
          esEdicion ? `Se actualizó "${categoria.name}".` : `Se creó "${categoria.name}".`,
        );
        this.dialogRef.close(true);
      },
      error: (error: HttpErrorResponse) => {
        this.$guardando.set(false);

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
