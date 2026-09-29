import { inject, Service } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BreakpointObserver } from "@angular/cdk/layout";
import { map } from "rxjs";

//Mismo corte que las hojas de estilo. Hace falta en TS porque la tabla se sustituye por tarjetas:
//ocultarla con display: none dejaría una tabla que el lector de pantalla sigue anunciando.
export const ANCHO_ESTRECHO = '(max-width: 1023px)';

@Service()
export class LayoutBreakpointService {

    private readonly breakpointObserver = inject(BreakpointObserver);

    readonly $esEstrecha = toSignal(
        this.breakpointObserver.observe(ANCHO_ESTRECHO).pipe(map((estado) => estado.matches)),
        { initialValue: this.breakpointObserver.isMatched(ANCHO_ESTRECHO) },
    );
}
