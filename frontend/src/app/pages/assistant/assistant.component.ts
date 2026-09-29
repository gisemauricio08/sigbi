import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { marked } from 'marked';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AssistantStore } from '../../store/assistant.store';

@Component({
  selector: 'app-assistant',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PageHeaderComponent,
  ],
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.css',
  providers: [AssistantStore],
})
export class AssistantComponent {

  private readonly assistantStore = inject(AssistantStore);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly $messages = this.assistantStore.$messages;
  protected readonly $sending = this.assistantStore.$sending;

  protected readonly $borrador = signal('');
  protected readonly $vacio = computed(() => this.$messages().length === 0);

  private readonly $hilo = viewChild<ElementRef<HTMLElement>>('hilo');

  //No menciona RAG hasta que la consulta sobre documentos entre en la entrega
  protected readonly subtitulo = 'Consulta el catálogo y las reservas en lenguaje natural';

  protected readonly sugerencias = [
    '¿Qué libros de historia hay disponibles?',
    '¿Cuántos libros tiene cada categoría?',
    '¿Qué ha reservado Ana Castillo?',
    'Registra una reserva para María',
  ];

  constructor() {
    effect(() => {
      this.$messages();

      const hilo = this.$hilo()?.nativeElement;

      if (hilo) queueMicrotask(() => hilo.scrollTo({ top: hilo.scrollHeight, behavior: 'smooth' }));
    });
  }

  //Es salida de un modelo: se sanitiza siempre, nunca bypassSecurityTrust
  protected render(contenido: string): SafeHtml {
    return this.sanitizer.sanitize(1, marked.parse(contenido, { async: false }) as string) ?? '';
  }

  protected escribir(evento: Event) {
    this.$borrador.set((evento.target as HTMLTextAreaElement).value);
  }

  protected teclear(evento: KeyboardEvent) {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      this.enviar();
    }
  }

  protected usarSugerencia(texto: string) {
    this.$borrador.set(texto);
    this.enviar();
  }

  protected enviar() {
    const texto = this.$borrador().trim();

    if (!texto || this.$sending()) return;

    this.assistantStore.ask(texto);
    this.$borrador.set('');
  }
}
