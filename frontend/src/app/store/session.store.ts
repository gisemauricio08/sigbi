import { computed, inject, Service, signal } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from "../../environments/environment.development";
import { RoleName } from "../model/role";
import { LoginService } from "../services/login.service";

//Espejo de GET /auth/user
interface UsuarioAutenticado {
    username: string;
    //Solo roles de SIGBI, no las autoridades técnicas del token
    roles: RoleName[];
}

//'cargando' no es "sin roles": decidir sobre la lista vacía del arranque mandaría a /403 a un ADMIN.
export type EstadoSesion = 'cargando' | 'lista' | 'fallida';

@Service()
export class SessionStore {

    private readonly loginService = inject(LoginService);
    private readonly router = inject(Router);

    //Se pide bajo demanda (cargar()): en /login aún no hay token y el 401 avisaría de una sesión no válida.
    //Se olvida al entrar y al salir: el singleton sobrevive al cambio de cuenta en la pestaña.
    private readonly $pedida = signal(false);

    //Con AUTH_ENABLED=false no se pide: permitAll respondería 200 con "anonymousUser" de Spring.
    private readonly usuarioResource = httpResource<UsuarioAutenticado>(
        () => environment.AUTH_ENABLED && this.$pedida() ? this.loginService.userInfoUrl : undefined,
    );

    //value() lanza con el recurso en error: hasValue() lo evita
    readonly $correo = computed(() =>
        this.usuarioResource.hasValue() ? this.usuarioResource.value().username : '',
    );

    //Solo la parte local: el correo entero no cabe en los 248 px del menú lateral.
    readonly $cuenta = computed(() => {
        if (!environment.AUTH_ENABLED) return 'Sin sesión';

        return this.$correo().split('@')[0];
    });

    readonly $estado = computed<EstadoSesion>(() => {
        if (!environment.AUTH_ENABLED) return 'lista';
        if (this.usuarioResource.hasValue()) return 'lista';
        if (this.usuarioResource.error()) return 'fallida';

        return 'cargando';
    });

    //AUTH_ENABLED=false: el backend es permitAll y la aplicación se comporta como ADMIN.
    readonly $roles = computed<RoleName[]>(() => {
        if (!environment.AUTH_ENABLED) return ['ADMIN'];

        return this.usuarioResource.hasValue() ? this.usuarioResource.value().roles ?? [] : [];
    });

    readonly $esAdmin = computed(() => this.$roles().includes('ADMIN'));

    //Idempotente: la llaman el layout y la guarda
    cargar() {
        this.$pedida.set(true);
    }

    olvidar() {
        this.$pedida.set(false);
    }

    salir() {
        this.loginService.logout().subscribe();
        this.olvidar();

        this.router.navigate(['/login']);
    }
}
