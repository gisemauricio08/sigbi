package com.sigbi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//linked (R-10): la cuenta conserva su contraseña anterior y el frontend lo avisa
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserResponse {

    private Integer idUser;

    private String username;

    private boolean linked;
}
