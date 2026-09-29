import { HttpErrorResponse } from "@angular/common/http";

//Sustituye a error.message, que está en inglés y lleva la URL interna del backend.
export function mensajeDeErrorHttp(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
        return 'No se pudo completar la operación.';
    }

    //status 0 primero: no hubo respuesta y message es el de la red ("Failed to fetch")
    if (error.status === 0) {
        return 'No se pudo contactar con el servidor. Comprueba que está encendido.';
    }

    const delBackend = typeof error.error?.message === 'string' ? error.error.message : null;

    if (delBackend) return delBackend;

    if (error.status === 404) return 'No existe el recurso solicitado.';

    return 'El servidor no pudo completar la operación.';
}
