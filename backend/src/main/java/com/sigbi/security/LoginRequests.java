package com.sigbi.security;

import jakarta.servlet.http.HttpServletRequest;

//Los resolvedores ignoran el token en el login: uno caducado daría 401 antes de validar
//las credenciales y nadie podría volver a entrar desde esa pestaña
final class LoginRequests {

    private LoginRequests() {
    }

    static boolean isLogin(HttpServletRequest request) {
        return request.getRequestURI().startsWith(request.getContextPath() + "/login");
    }
}
