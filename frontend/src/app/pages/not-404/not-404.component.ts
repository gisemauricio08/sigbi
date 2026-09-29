import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ErrorPageComponent } from '../../shared/components/error-page/error-page.component';

/** Ruta inexistente. Un 404 de recurso no llega aquí: lo resuelve la tabla que lo pidió. */
@Component({
  selector: 'app-not-404',
  imports: [ErrorPageComponent, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <app-error-page
      icono="explore_off"
      titulo="Página no encontrada"
      mensaje="La dirección que has abierto no corresponde a ninguna pantalla de SIGBI."
    >
      <a mat-flat-button routerLink="/pages/dashboard">
        <mat-icon>dashboard</mat-icon>
        Ir al panel
      </a>
    </app-error-page>
  `,
})
export class Not404Component {}
