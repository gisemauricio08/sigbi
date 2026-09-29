import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { PERSONAL } from '../../guards/rol.guard';
import { ErrorPageComponent } from '../../shared/components/error-page/error-page.component';
import { SessionStore } from '../../store/session.store';

/**
 * Sin permiso (FEAT-003). Sin ningún rol o con la cuenta deshabilitada, "Volver" al panel
 * sería un bucle: solo se ofrece salir.
 */
@Component({
  selector: 'app-not-403',
  imports: [ErrorPageComponent, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './not-403.component.html',
})
export class Not403Component {

  private readonly sessionStore = inject(SessionStore);

  protected readonly conSesion = environment.AUTH_ENABLED;

  protected readonly $pie = computed(() =>
    this.conSesion && this.sessionStore.$correo() ? `Has entrado como ${this.sessionStore.$correo()}` : '',
  );

  //Hasta que la sesión responde no se sabe qué caso es: no se ofrece "Volver"
  protected readonly $tieneAcceso = computed(() =>
    this.sessionStore.$estado() === 'lista'
      && this.sessionStore.$roles().some((rol) => PERSONAL.includes(rol)),
  );

  protected readonly $mensaje = computed(() => {
    if (this.sessionStore.$estado() !== 'lista' || this.$tieneAcceso()) {
      return 'Tu cuenta no tiene permiso para abrir esta página. Si necesitas entrar, pide a un administrador que revise tu rol.';
    }

    return 'Tu cuenta no tiene acceso a SIGBI: no tiene ningún rol asignado o está deshabilitada. Pide a un administrador que la revise.';
  });

  constructor() {
    //También se llega recargando /403 o desde el interceptor, sin pasar por la guarda
    this.sessionStore.cargar();
  }

  salir() {
    this.sessionStore.salir();
  }
}
