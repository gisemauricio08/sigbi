package com.sigbi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//configured=false: el contenido es un aviso del sistema, no una respuesta del modelo
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssistantResponse {

    private String content;

    private boolean configured;
}
