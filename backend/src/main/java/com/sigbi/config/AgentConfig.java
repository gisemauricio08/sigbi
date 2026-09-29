package com.sigbi.config;

import com.sigbi.tool.CatalogTool;
import com.sigbi.tool.ReservationTool;
import com.sigbi.util.PromptLoader;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AgentConfig {

    //Basta para seguir "¿y de esa categoría?" sin que el contexto crezca sin control
    private static final int MENSAJES_RECORDADOS = 10;

    //Memoria del proceso, no la tabla JDBC de Spring AI: la conversación muere con el servidor
    @Bean
    public ChatClient libraryChatClient(OpenAiChatModel chatModel,
                                        PromptLoader promptLoader,
                                        CatalogTool catalogTool,
                                        ReservationTool reservationTool) {
        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .chatMemoryRepository(new InMemoryChatMemoryRepository())
                .maxMessages(MENSAJES_RECORDADOS)
                .build();

        return ChatClient.builder(chatModel)
                .defaultSystem(promptLoader.load("library-agent.md"))
                .defaultTools(catalogTool, reservationTool)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }
}
