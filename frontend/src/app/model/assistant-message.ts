export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
    pending?: boolean;
    //Respuesta del sistema, no del modelo (p. ej. sin clave de OpenAI)
    notice?: boolean;
}
