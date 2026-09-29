import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../environments/environment.development";
import { TOKEN_NAME } from "../services/login.service";

export const bearerTokenInterceptor: HttpInterceptorFn = (req, next) => {

    //En modo cookie el navegador envía la cookie solo
    if(environment.AUTH_MODE !== 'bearer') return next(req);

    const token = sessionStorage.getItem(TOKEN_NAME);

    //Sin token en /login: uno caducado haría que el backend rechazara la petición antes de mirar las credenciales
    if(!token || req.url.includes('/login')) return next(req);

    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

    return next(cloned);
}
