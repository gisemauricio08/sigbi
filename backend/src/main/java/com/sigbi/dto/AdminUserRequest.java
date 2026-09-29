package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

//R-8: el correo es el username
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminUserRequest {

    @NotBlank(message = "{user.email.required}")
    @Email(message = "{user.email.format}")
    @Size(max = 60, message = "{user.email.size}")
    private String email;

    @NotBlank(message = "{user.password.size}")
    @Size(min = 6, max = 60, message = "{user.password.size}")
    private String password;

    //R-7 lo valida el servicio antes de llamar a Supabase
    private List<String> roles;
}
