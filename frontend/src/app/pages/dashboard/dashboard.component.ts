import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { mensajeDeErrorHttp } from '../../shared/utils/http-error-message';
import { categoryToneClass, chartToneClass } from '../../shared/utils/category-tone';
import { plural } from '../../shared/utils/plural';
import { DashboardStore } from '../../store/dashboard.store';

interface Indicador {
  rotulo: string;
  cifra: number;
  detalle: string;
  icono: string;
  //Tono del icono, del semáforo de estados
  tono: 'primario' | 'exito' | 'aviso' | 'acento';
}

/**
 * Solo lectura. Las cifras secundarias son hechos, no tendencias: no hay histórico con el
 * que comparar.
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
    PageHeaderComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [DashboardStore],
})
export class DashboardComponent {

  private readonly dashboardStore = inject(DashboardStore);

  protected readonly $loading = this.dashboardStore.$loading;
  protected readonly $error = this.dashboardStore.$error;
  protected readonly $porCategoria = this.dashboardStore.$porCategoria;
  protected readonly $totalLibros = this.dashboardStore.$totalLibros;

  private readonly $maximo = this.dashboardStore.$maximoPorCategoria;

  protected readonly $indicadores = computed<Indicador[]>(() => [
    {
      rotulo: 'Libros en el catálogo',
      cifra: this.dashboardStore.$totalLibros(),
      detalle: `${plural(this.dashboardStore.$categoriasActivas(), 'categoría activa los clasifica', 'categorías activas los clasifican')}`,
      icono: 'menu_book',
      tono: 'primario',
    },
    {
      rotulo: 'Disponibles ahora',
      cifra: this.dashboardStore.$disponibles(),
      detalle: `${plural(this.dashboardStore.$reservados(), 'reservado', 'reservados')}, el ${this.dashboardStore.$porcentajeReservado()} % del catálogo`,
      icono: 'check_circle',
      tono: 'exito',
    },
    {
      rotulo: 'Reservas registradas',
      cifra: this.dashboardStore.$totalReservas(),
      detalle: `${this.dashboardStore.$reservasRecientes()} en los últimos 7 días`,
      icono: 'event',
      tono: 'acento',
    },
    {
      rotulo: 'Clientes',
      cifra: this.dashboardStore.$totalClientes(),
      detalle: `${this.dashboardStore.$clientesConReserva()} con alguna reserva`,
      icono: 'group',
      tono: 'aviso',
    },
  ]);

  //Porcentaje del máximo; una categoría sin libros conserva su fila con el rótulo
  protected anchura(total: number) {
    return `${(total / this.$maximo()) * 100}%`;
  }

  protected tonoBarra(nombre: string) {
    return chartToneClass(nombre);
  }

  protected tonoChip(nombre: string) {
    return categoryToneClass(nombre);
  }

  protected mensajeDeError(error: unknown) {
    return mensajeDeErrorHttp(error);
  }

  protected recargar() {
    this.dashboardStore.reload();
  }
}
