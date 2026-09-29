package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginRequest {

    //El email de la identidad en Supabase
    @NotBlank(message = "{login.username.required}")
    @Size(max = 60, message = "{login.username.size}")
    private String username;

    @NotBlank(message = "{login.password.required}")
    @Size(max = 60, message = "{login.password.size}")
    private String password;
}
