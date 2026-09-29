import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../store/session.store';

//El avatar de cuenta solo se ve por debajo de 1024 px, donde no hay menú lateral.
@Component({
  selector: 'app-page-header',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  template: `
    <header class="topbar">
      <div class="topbar__titles">
        <h1 class="topbar__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="topbar__subtitle">{{ subtitle() }}</p>
        }
      </div>

      <div class="topbar__actions">
        <ng-content />

        <button
          class="topbar__cuenta"
          mat-icon-button
          type="button"
          [matMenuTriggerFor]="menuCuenta"
          aria-label="Cuenta y cerrar sesión"
        >
          <mat-icon>person</mat-icon>
        </button>

        <mat-menu #menuCuenta="matMenu">
          <div class="cuenta-menu__correo">{{ $correo() || 'Sin sesión' }}</div>
          <!-- Usuarios no cabe en la barra inferior: sin esta entrada, en móvil no habría cómo llegar -->
          @if ($esAdmin()) {
            <a mat-menu-item routerLink="/pages/user">
              <mat-icon>manage_accounts</mat-icon>
              <span>Usuarios</span>
            </a>
          }
          <button mat-menu-item type="button" (click)="salir()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: `
    .topbar {
      display: flex;
      align-items: center;
      gap: var(--sigbi-space-4);
      min-height: var(--sigbi-topbar-height);
      padding: 20px var(--sigbi-space-6);
      background: var(--mat-sys-surface);
    }

    .topbar__titles {
      flex: 1 1 auto;
      min-width: 0;
    }

    .topbar__title {
      font: var(--mat-sys-headline-medium);
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    .topbar__subtitle {
      font-family: var(--mat-sys-body-medium-font);
      font-size: 13px;
      line-height: 18px;
      color: var(--mat-sys-on-surface-variant);
      margin: 2px 0 0;
    }

    .topbar__actions {
      display: flex;
      align-items: center;
      gap: var(--sigbi-space-3);
      flex-shrink: 0;
    }

    .topbar__cuenta {
      display: none;
    }

    .cuenta-menu__correo {
      padding: var(--sigbi-space-3) var(--sigbi-space-4);
      font-family: var(--mat-sys-body-medium-font);
      font-size: 13px;
      line-height: 18px;
      color: var(--mat-sys-on-surface-variant);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    @media (max-width: 1023px) {
      .topbar__cuenta {
        display: inline-flex;
      }

      .topbar {
        padding: var(--sigbi-space-3) var(--sigbi-space-4);
        min-height: 56px;
      }

      .topbar__title {
        font-size: 24px;
        line-height: 30px;
      }
    }
  `,
})
export class PageHeaderComponent {
  private readonly sessionStore = inject(SessionStore);

  readonly title = input.required<string>();
  readonly subtitle = input<string>('');

  protected readonly $correo = this.sessionStore.$correo;
  protected readonly $esAdmin = this.sessionStore.$esAdmin;

  protected salir() {
    this.sessionStore.salir();
  }
}
