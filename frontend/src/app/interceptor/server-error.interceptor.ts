import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { catchError, EMPTY, retry, tap, throwError } from "rxjs";
import { environment } from "../../environments/environment.development";
import { TOKEN_NAME } from "../services/login.service";
import { ERROR_DE_FORMULARIO } from "../shared/http/form-error.context";
import { mensajeDeErrorHttp } from "../shared/utils/http-error-message";

//Cubre /login y /login/bearer
const esDelLogin = (url: string) => url.includes('/login');

export const serverErrorInterceptor: HttpInterceptorFn = (req, next) => {

    const snackBar = inject(MatSnackBar);
    const router = inject(Router);

    const retryCount = req.method === 'GET' ? environment.RETRY : 0;

    return next(req).pipe(
        tap((event) => {
            const body =
                event instanceof HttpResponse
                ? (event.body as { error?: boolean; errorMessage?: string })
                : null;
            if (body?.error === true && body.errorMessage) {
                throw new Error(body.errorMessage);
            }
        }),
        retry({ count: retryCount, delay: 1000 }),
        catchError((err: HttpErrorResponse) => {
            //Un 400 de formulario vuelve al diálogo para pintarlo bajo su campo
            if (err.status === 400 && req.context.get(ERROR_DE_FORMULARIO)) {
                return throwError(() => err);
            }

            //Un 401 del propio login son credenciales erróneas: no se navega, para no perder el correo escrito.
            //Un 403 no va a /login: la sesión es válida y sería un bucle.
            if (err.status === 401 && esDelLogin(req.url)) {
                snackBar.open('Correo o contraseña incorrectos.', 'Cerrar', { duration: 6000 });
            } else if (err.status === 401) {
                //Token caducado: se descarta para que el siguiente login no lo arrastre
                sessionStorage.removeItem(TOKEN_NAME);
                snackBar.open('Tu sesión no es válida. Vuelve a entrar.', 'Cerrar', { duration: 6000 });
                router.navigate(['/login']);
            } else if (err.status === 403) {
                router.navigate(['/403']);
            } else {
                snackBar.open(mensajeDeErrorHttp(err), 'Cerrar', { duration: 6000 });
            }

            //Una lectura necesita el error: con EMPTY el httpResource se queda en isLoading() para siempre
            //y el banner con Reintentar no aparece. Una escritura ya ha dado su aviso.
            return req.method === 'GET' ? throwError(() => err) : EMPTY;
        })
    );
}

