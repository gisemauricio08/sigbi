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
import { filter } from 'rxjs';
import { User } from '../../model/user';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LayoutBreakpointService } from '../../shared/services/layout-breakpoint.service';
import { NotificationService } from '../../shared/services/notification.service';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { etiquetaDeRol } from '../../shared/utils/role-label';
import { SessionStore } from '../../store/session.store';
import { UserStore } from '../../store/user.store';
import { UserDialogComponent, UserDialogData } from './user-dialog/user-dialog.component';

type FiltroEstado = 'todos' | 'activos' | 'deshabilitados';

/** Sin acción de eliminar: un usuario no se borra, se deshabilita (R-4). */
@Component({
  selector: 'app-user',
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
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
  providers: [UserStore],
})
export class UserComponent {

  private readonly userStore = inject(UserStore);
  private readonly sessionStore = inject(SessionStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);

  protected readonly $users = this.userStore.$users;
  protected readonly $loading = this.userStore.$loading;
  protected readonly $error = this.userStore.$error;

  //R-6: protege la fila propia. Con AUTH_ENABLED en false no hay correo y ninguna fila lo es.
  private readonly $correo = this.sessionStore.$correo;

  protected readonly $esEstrecha = inject(LayoutBreakpointService).$esEstrecha;

  protected readonly $busqueda = signal('');
  protected readonly $estado = signal<FiltroEstado>('todos');

  //Paginación de las tarjetas; la tabla pagina con MatTableDataSource
  protected readonly $pagina = signal({ indice: 0, tamano: 10 });

  protected readonly dataSource = new MatTableDataSource<User>();
  protected readonly $paginator = viewChild(MatPaginator);
  protected readonly $sort = viewChild(MatSort);

  protected readonly displayedColumns = ['username', 'roles', 'enabled', 'actions'];

  protected readonly $filtrados = computed(() => {
    const texto = this.$busqueda().trim().toLowerCase();
    const estado = this.$estado();

    return this.$users().filter((usuario) => {
      const casaTexto = !texto || usuario.username.toLowerCase().includes(texto);

      const casaEstado =
        estado === 'todos' ||
        (estado === 'activos' && usuario.enabled) ||
        (estado === 'deshabilitados' && !usuario.enabled);

      return casaTexto && casaEstado;
    });
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

  protected etiqueta(rol: string) {
    return etiquetaDeRol(rol);
  }

  protected esPropia(usuario: User) {
    return !!this.$correo() && usuario.username.toLowerCase() === this.$correo().toLowerCase();
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
    this.$estado.set('todos');
  }

  protected abrirDialogo(usuario?: User) {
    const data: UserDialogData = {
      user: usuario ?? null,
      esPropia: usuario ? this.esPropia(usuario) : false,
    };

    this.dialog
      .open(UserDialogComponent, { width: '560px', data, disableClose: true })
      .afterClosed()
      .pipe(filter((guardado) => guardado))
      .subscribe(() => this.userStore.reload());
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.userStore.reload();
  }
}
