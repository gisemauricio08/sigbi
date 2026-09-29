import { inject, Service, signal } from "@angular/core";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { LoginService } from "../services/login.service";
import { SessionStore } from "./session.store";

@Service({ autoProvided: false })
export class LoginStore {

    private readonly loginService = inject(LoginService);
    private readonly router = inject(Router);
    private readonly sessionStore = inject(SessionStore);

    private readonly _loggingIn = signal(false);
    readonly $loggingIn = this._loggingIn.asReadonly();

    login(username: string, password: string){
        if(this._loggingIn()) return;

        this._loggingIn.set(true);

        this.loginService.login(username, password).pipe(
            //El interceptor corta con EMPTY: llega complete, nunca error. Por eso finalize y no el callback error.
            finalize(() => this._loggingIn.set(false)),
        ).subscribe(() => {
            //Una sesión caducada no pasa por salir(): sin olvidar() heredaría los roles de la cuenta anterior.
            this.sessionStore.olvidar();
            this.router.navigate(['/pages/dashboard']);
        });
    }
}
