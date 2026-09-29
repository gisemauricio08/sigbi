package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//También es el resumen anidado en una reserva: NON_NULL oculta los campos sin rellenar
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClientDTO {

    private Integer idClient;

    @NotBlank(message = "{client.firstName.required}")
    @Size(min = 1, max = 70, message = "{client.firstName.size}")
    private String firstName;

    @NotBlank(message = "{client.lastName.required}")
    @Size(min = 1, max = 70, message = "{client.lastName.size}")
    private String lastName;

    @NotBlank(message = "{client.dni.required}")
    @Pattern(regexp = "\\d{8}", message = "{client.dni.pattern}")
    private String dni;

    @NotBlank(message = "{client.email.required}")
    @Email(message = "{client.email.format}")
    @Size(max = 55, message = "{client.email.size}")
    private String email;
}
