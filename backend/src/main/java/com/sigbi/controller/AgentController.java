package com.sigbi.controller;

import com.openai.errors.OpenAIException;
import com.openai.errors.OpenAIIoException;
import com.openai.errors.OpenAIServiceException;
import com.openai.errors.RateLimitException;
import com.sigbi.dto.AssistantRequest;
import com.sigbi.dto.AssistantResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//Los fallos del proveedor (sin clave, saturado, mal configurado) se responden como aviso
//con configured=false, no como 500
@Slf4j
@RestController
@RequestMapping("/v1/agents")
@RequiredArgsConstructor
public class AgentController {

    private final ChatClient libraryChatClient;
    private final MessageSource messageSource;

    @Value("${spring.ai.openai.api-key:}")
    private String openAiKey;

    @PostMapping
    public ResponseEntity<AssistantResponse> ask(@Valid @RequestBody AssistantRequest request) {
        if (openAiKey == null || openAiKey.isBlank()) {
            return aviso("assistant.notConfigured");
        }

        try {
            String contenido = libraryChatClient.prompt()
                    .user(request.getMessage())
                    //El identificador lo pone el frontend y dura lo que dura la pestaña
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, request.getConversationId()))
                    .call()
                    .content();

            return ResponseEntity.ok(new AssistantResponse(contenido, true));
        } catch (RuntimeException e) {
            OpenAIException proveedor = causaDelProveedor(e);

            //Un fallo que no viene del proveedor es un error de SIGBI: sigue su camino al 500
            if (proveedor == null) {
                throw e;
            }

            //Cuota agotada, 5xx o red caída pasan solos; clave o modelo rechazados, no
            if (esPasajero(proveedor)) {
                log.warn("ASSISTANT PROVIDER UNAVAILABLE: {}", resumen(proveedor));
                return aviso("assistant.unavailable");
            }

            log.error("ASSISTANT PROVIDER REJECTED THE REQUEST: {}", resumen(proveedor));
            return aviso("assistant.misconfigured");
        }
    }

    private ResponseEntity<AssistantResponse> aviso(String clave) {
        String texto = messageSource.getMessage(clave, null, LocaleContextHolder.getLocale());
        return ResponseEntity.ok(new AssistantResponse(texto, false));
    }

    //Spring AI puede envolver la excepción del cliente; se busca en la cadena de causas
    private static OpenAIException causaDelProveedor(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof OpenAIException proveedor) {
                return proveedor;
            }
        }
        return null;
    }

    private static boolean esPasajero(OpenAIException e) {
        return e instanceof RateLimitException
                || e instanceof OpenAIIoException
                || (e instanceof OpenAIServiceException servicio && servicio.statusCode() >= 500);
    }

    //Solo código y tipo: el cuerpo del proveedor es largo y no aporta en el log
    private static String resumen(OpenAIException e) {
        return e instanceof OpenAIServiceException servicio
                ? servicio.statusCode() + " " + e.getClass().getSimpleName()
                : e.getClass().getSimpleName();
    }
}
