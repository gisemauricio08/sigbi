import { HttpInterceptorFn } from "@angular/common/http";

//Imprescindible en modo cookie: permite guardar y enviar la cookie jwt entre :4200 y :8080.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {

    const cloned = req.clone({ withCredentials: true });

    return next(cloned);
}
