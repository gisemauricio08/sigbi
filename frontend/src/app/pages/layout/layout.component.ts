import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { PERSONAL, SOLO_ADMIN } from '../../guards/rol.guard';
import { RoleName } from '../../model/role';
import { etiquetaDeRol } from '../../shared/utils/role-label';
import { SessionStore } from '../../store/session.store';

interface Destino {
  etiqueta: string;
  icono: string;
  ruta: string;
  //La barra inferior lleva cinco destinos: Categorías se alcanza desde Libros y Usuarios no entra.
  enMovil: boolean;
  //Las mismas listas que la guarda de su ruta (FEAT-003).
  roles: RoleName[];
}

@Component({
  selector: 'app-layout',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {

  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly $cuenta = this.sessionStore.$cuenta;
  protected readonly $correo = this.sessionStore.$correo;

  private readonly destinos: Destino[] = [
    { etiqueta: 'Panel', icono: 'dashboard', ruta: '/pages/dashboard', enMovil: true, roles: PERSONAL },
    { etiqueta: 'Libros', icono: 'menu_book', ruta: '/pages/book', enMovil: true, roles: PERSONAL },
    { etiqueta: 'Categorías', icono: 'sell', ruta: '/pages/category', enMovil: false, roles: PERSONAL },
    { etiqueta: 'Clientes', icono: 'group', ruta: '/pages/client', enMovil: true, roles: PERSONAL },
    { etiqueta: 'Reservas', icono: 'event', ruta: '/pages/reservation', enMovil: true, roles: PERSONAL },
    //Asistente cierra el menú en todos los perfiles
    { etiqueta: 'Usuarios', icono: 'manage_accounts', ruta: '/pages/user', enMovil: false, roles: SOLO_ADMIN },
    { etiqueta: 'Asistente', icono: 'auto_awesome', ruta: '/pages/assistant', enMovil: true, roles: PERSONAL },
  ];

  //Sin roles cargados el menú sale vacío en vez de enseñar destinos que luego desaparecen
  protected readonly $destinos = computed(() => {
    const roles = this.sessionStore.$roles();

    return this.destinos.filter((d) => d.roles.some((rol) => roles.includes(rol)));
  });

  protected readonly $destinosMoviles = computed(() => this.$destinos().filter((d) => d.enMovil));

  protected readonly $perfil = computed(() => {
    const roles = this.sessionStore.$roles();

    if (roles.includes('ADMIN')) return etiquetaDeRol('ADMIN');
    if (roles.includes('BIBLIOTECARIO')) return etiquetaDeRol('BIBLIOTECARIO');

    return '';
  });

  //Sobre la url y no con routerLinkActive: durante el asistente de reserva sigue activo Reservas
  private readonly $url = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly $activo = computed(() => {
    const url = this.$url();

    if (url.startsWith('/pages/reservation')) return '/pages/reservation';

    return this.destinos.find((d) => url.startsWith(d.ruta))?.ruta ?? '';
  });

  constructor() {
    //Cubre rutas hijas sin guarda; pedirla dos veces no repite la petición.
    this.sessionStore.cargar();
  }

  salir() {
    this.sessionStore.salir();
  }
}
