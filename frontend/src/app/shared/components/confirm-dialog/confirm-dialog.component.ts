import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
    titulo: string;
    mensaje: string;
    //Efecto colateral, p. ej. RN-13 al eliminar una reserva
    consecuencia?: string;
    textoAceptar?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>

    <mat-dialog-content>
      <p class="mensaje">{{ data.mensaje }}</p>
      @if (data.consecuencia) {
        <p class="consecuencia">
          <mat-icon class="consecuencia__icono">info</mat-icon>
          <span>{{ data.consecuencia }}</span>
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button type="button" class="destructivo" [mat-dialog-close]="true" cdkFocusInitial>
        <mat-icon>delete</mat-icon>
        <span>{{ data.textoAceptar ?? 'Eliminar' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .mensaje {
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface);
      margin: 0;
      max-width: 46ch;
    }

    .consecuencia {
      display: flex;
      align-items: flex-start;
      gap: var(--sigbi-space-2);
      margin: var(--sigbi-space-4) 0 0;
      padding: var(--sigbi-space-3);
      border-radius: var(--sigbi-radius-sm);
      background: var(--sigbi-warn-bg);
      color: var(--sigbi-warn-fg);
      font: var(--mat-sys-body-medium);
      max-width: 46ch;
    }

    .consecuencia__icono {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .destructivo {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
      --mat-button-filled-icon-color: var(--mat-sys-on-error);
    }
  `,
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
