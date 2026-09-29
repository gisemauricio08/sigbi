import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { filter, switchMap, tap } from 'rxjs';
import { Category } from '../../model/category';
import { CategoryService } from '../../services/category.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { LayoutBreakpointService } from '../../shared/services/layout-breakpoint.service';
import { NotificationService } from '../../shared/services/notification.service';
import { categoryToneClass } from '../../shared/utils/category-tone';
import { plural } from '../../shared/utils/plural';
import { CategoryStore } from '../../store/category.store';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';

type FiltroEstado = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-category',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
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
  templateUrl: './category.component.html',
  styleUrl: './category.component.css',
  providers: [CategoryStore],
})
export class CategoryComponent {

  private readonly categoryStore = inject(CategoryStore);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);

  protected readonly $categories = this.categoryStore.$categories;
  protected readonly $loading = this.categoryStore.$loading;
  protected readonly $error = this.categoryStore.$error;

  protected readonly $esEstrecha = inject(LayoutBreakpointService).$esEstrecha;

  protected readonly $busqueda = signal('');
  protected readonly $estado = signal<FiltroEstado>('todas');

  //Paginación de las tarjetas; la tabla pagina con MatTableDataSource
  protected readonly $pagina = signal({ indice: 0, tamano: 10 });

  protected readonly dataSource = new MatTableDataSource<Category>();
  protected readonly $paginator = viewChild(MatPaginator);
  protected readonly $sort = viewChild(MatSort);

  protected readonly displayedColumns = ['name', 'description', 'status', 'bookCount', 'actions'];

  protected readonly $filtradas = computed(() => {
    const texto = this.$busqueda().trim().toLowerCase();
    const estado = this.$estado();

    return this.$categories().filter((categoria) => {
      const casaTexto =
        !texto ||
        categoria.name.toLowerCase().includes(texto) ||
        categoria.description.toLowerCase().includes(texto);

      const casaEstado =
        estado === 'todas' ||
        (estado === 'activas' && categoria.status) ||
        (estado === 'inactivas' && !categoria.status);

      return casaTexto && casaEstado;
    });
  });

  protected readonly $hayFiltro = computed(
    () => this.$busqueda().trim().length > 0 || this.$estado() !== 'todas',
  );

  protected readonly $enPagina = computed(() => {
    const { indice, tamano } = this.$pagina();

    return this.$filtradas().slice(indice * tamano, indice * tamano + tamano);
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.$filtradas();
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

  protected tono(nombre: string) {
    return categoryToneClass(nombre);
  }

  protected buscar(evento: Event) {
    this.$busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected cambiarEstado(estado: FiltroEstado) {
    this.$estado.set(estado);
  }

  protected cambiarPagina(evento: { pageIndex: number; pageSize: number }) {
    this.$pagina.set({ indice: evento.pageIndex, tamano: evento.pageSize });
  }

  protected limpiarFiltros() {
    this.$busqueda.set('');
    this.$estado.set('todas');
  }

  protected abrirDialogo(idCategory?: number) {
    this.dialog
      .open(CategoryDialogComponent, { width: '560px', data: idCategory ?? null, disableClose: true })
      .afterClosed()
      .pipe(filter((guardado) => guardado))
      .subscribe(() => this.categoryStore.reload());
  }

  //Una categoría con libros no se elimina (400 del servidor); se avisa antes con el recuento
  //que ya trae la tabla
  protected eliminar(categoria: Category) {
    const libros = categoria.bookCount ?? 0;

    const data: ConfirmDialogData = {
      titulo: 'Eliminar categoría',
      mensaje: `Se eliminará la categoría "${categoria.name}".`,
      consecuencia: libros
        ? `${plural(libros, 'libro clasificado', 'libros clasificados')}. El servidor rechazará la eliminación mientras ${libros === 1 ? 'siga' : 'sigan'} ahí.`
        : undefined,
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => this.categoryService.delete(categoria.idCategory)),
        tap(() => this.notificationService.notify(`Se eliminó "${categoria.name}".`)),
      )
      .subscribe(() => this.categoryStore.reload());
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.categoryStore.reload();
  }
}
