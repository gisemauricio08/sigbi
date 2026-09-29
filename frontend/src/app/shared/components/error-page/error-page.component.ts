import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

//Fuera del shell: cada página proyecta su propia salida como acción.
@Component({
  selector: 'app-error-page',
  imports: [MatCardModule, MatIconModule],
  template: `
    <main class="error-container">
      <mat-card class="error-card">
        <mat-icon class="error__icono" aria-hidden="true">{{ icono() }}</mat-icon>
        <h1 class="error__titulo">{{ titulo() }}</h1>
        <p class="error__mensaje">{{ mensaje() }}</p>
        <div class="error__acciones">
          <ng-content />
        </div>
        @if (pie()) {
          <p class="error__pie">{{ pie() }}</p>
        }
      </mat-card>
    </main>
  `,
  styles: `
    .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      /* dvh con vh de respaldo: en móvil vh no es la altura visible */
      min-height: 100vh;
      min-height: 100dvh;
      padding: var(--sigbi-space-4);
      box-sizing: border-box;
    }

    .error-card {
      width: min(400px, 100%);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: var(--sigbi-space-6) var(--sigbi-space-5) var(--sigbi-space-5);
    }

    /* Primary y no Error: el rojo queda para lo que el usuario tiene que corregir */
    .error__icono {
      color: var(--mat-sys-primary);
      font-size: 40px;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }

    .error__titulo {
      font-family: var(--mat-sys-headline-medium-font);
      font-size: 28px;
      line-height: 36px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: var(--sigbi-space-3) 0 0;
    }

    .error__mensaje {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
      margin: var(--sigbi-space-3) 0 0;
    }

    .error__acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--sigbi-space-2);
      margin-top: var(--sigbi-space-5);
    }

    .error__acciones:empty {
      display: none;
    }

    .error__pie {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      margin: var(--sigbi-space-4) 0 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class ErrorPageComponent {
  readonly icono = input.required<string>();
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly pie = input('');
}
