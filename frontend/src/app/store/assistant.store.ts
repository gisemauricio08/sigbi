import { inject, Service, signal } from "@angular/core";
import { AssistantMessage } from "../model/assistant-message";
import { AssistantService } from "../services/assistant.service";

function nuevoIdDeHilo(): string {
    const aleatorio = Math.random().toString(36).slice(2, 10);

    return `hilo-${Date.now().toString(36)}-${aleatorio}`;
}

//El backend recuerda el hilo por conversationId: se genera una vez por pantalla y viaja en cada turno.
@Service({ autoProvided: false })
export class AssistantStore {

    private readonly assistantService = inject(AssistantService);

    //Sin crypto.randomUUID(): solo existe en contexto seguro y por HTTP sin TLS lanza TypeError.
    private readonly conversationId = nuevoIdDeHilo();

    private readonly _messages = signal<AssistantMessage[]>([]);
    readonly $messages = this._messages.asReadonly();

    private readonly _sending = signal(false);
    readonly $sending = this._sending.asReadonly();

    ask(message: string) {
        const texto = message.trim();

        if (!texto || this._sending()) return;

        this._sending.set(true);
        this._messages.update((mensajes) => [
            ...mensajes,
            { role: 'user', content: texto },
            { role: 'assistant', content: '', pending: true },
        ]);

        //serverErrorInterceptor corta las escrituras fallidas con EMPTY: llega complete sin next
        //ni error, y sin este control la burbuja se quedaría pendiente para siempre
        let respondio = false;

        this.assistantService.ask(texto, this.conversationId).subscribe({
            next: (respuesta) => {
                respondio = true;
                this.resolverUltimo({
                    role: 'assistant',
                    content: respuesta.content,
                    notice: !respuesta.configured,
                });
            },
            error: () => this.resolverSinRespuesta(),
            complete: () => {
                if (!respondio) this.resolverSinRespuesta();
            },
        });
    }

    private resolverSinRespuesta() {
        this.resolverUltimo({
            role: 'assistant',
            content: 'No se pudo consultar al asistente. Inténtalo de nuevo.',
            notice: true,
        });
    }

    private resolverUltimo(mensaje: AssistantMessage) {
        this._messages.update((mensajes) => [...mensajes.slice(0, -1), mensaje]);
        this._sending.set(false);
    }

    reset() {
        this._messages.set([]);
    }
}
