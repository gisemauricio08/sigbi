package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

//En el PUT solo cuentan enabled y el nombre de cada rol
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDTO {

    private Integer idUser;

    private String username;

    //Boolean y no boolean: un PUT sin el campo no debe deshabilitar la cuenta por omisión
    @NotNull(message = "{user.enabled.required}")
    private Boolean enabled;

    //R-7
    private List<RoleDTO> roles;
}
