import { HttpErrorResponse } from "@angular/common/http";

//El message de un 400 es "campo: texto, campo: texto" (Bean Validation) o un texto suelto (regla de negocio).
export interface ErroresDelServidor {
    porCampo: Record<string, string>;
    general?: string;
}

export function parsearErroresDelServidor(
    error: HttpErrorResponse,
    camposConocidos: readonly string[],
): ErroresDelServidor {
    const mensaje: string = error.error?.message ?? error.message ?? 'La operación fue rechazada.';

    const porCampo: Record<string, string> = {};
    const sueltos: string[] = [];

    for (const trozo of mensaje.split(',')) {
        const separador = trozo.indexOf(':');
        const campo = separador > 0 ? trozo.slice(0, separador).trim() : '';

        if (camposConocidos.includes(campo)) {
            porCampo[campo] = trozo.slice(separador + 1).trim();
        } else {
            sueltos.push(trozo.trim());
        }
    }

    const general = sueltos.join(', ');

    return general ? { porCampo, general } : { porCampo };
}
