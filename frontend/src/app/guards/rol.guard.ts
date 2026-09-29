import { effect, inject, Injector } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { RoleName } from "../model/role";
import { EstadoSesion, SessionStore } from "../store/session.store";

//Una sola lista para rutas y menú: el menú no ofrece lo que la ruta rechaza.
export const PERSONAL: RoleName[] = ['ADMIN', 'BIBLIOTECARIO'];
export const SOLO_ADMIN: RoleName[] = ['ADMIN'];

//Espera a que la sesión cargue: con $roles aún vacío mandaría a /403 a un ADMIN. Se espera con un
//effect y no con toObservable, que repetiría la sesión de la cuenta anterior tras cambiar de usuario.
//Si la sesión falla no navega: el interceptor ya decidió. Es comodidad, no seguridad: el backend responde 403.
export const rolGuard = (permitidos: RoleName[]): CanActivateFn => () => {
    const sessionStore = inject(SessionStore);
    const router = inject(Router);
    const injector = inject(Injector);

    const decidir = (estado: EstadoSesion, roles: RoleName[]): boolean | UrlTree => {
        if (estado === 'fallida') return false;

        return roles.some((rol) => permitidos.includes(rol)) ? true : router.createUrlTree(['/403']);
    };

    sessionStore.cargar();

    if (sessionStore.$estado() !== 'cargando') {
        return decidir(sessionStore.$estado(), sessionStore.$roles());
    }

    return new Promise<boolean | UrlTree>((resolve) => {
        const vigilante = effect(() => {
            const estado = sessionStore.$estado();

            if (estado === 'cargando') return;

            resolve(decidir(estado, sessionStore.$roles()));
            vigilante.destroy();
        }, { injector });
    });
};
