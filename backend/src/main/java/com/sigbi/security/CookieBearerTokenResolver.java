package com.sigbi.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

//Cookie HttpOnly: JavaScript no puede leer el token
@Component
@ConditionalOnProperty(name = "app.auth.mode", havingValue = "cookie", matchIfMissing = true)
public class CookieBearerTokenResolver implements BearerTokenResolver {

    public static final String COOKIE_NAME = "jwt";

    @Override
    public String resolve(HttpServletRequest request) {
        if (LoginRequests.isLogin(request)) {
            return null;
        }

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }

        //Sin cookie la petición sigue como anónima y la cadena decide si el recurso es público
        return null;
    }
}
