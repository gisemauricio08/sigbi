package com.sigbi.util;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

import java.io.IOException;

//Se ejecuta antes que la cadena de seguridad, si no el 401 saldría sin cabeceras CORS
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CORS implements Filter {

    //Origen concreto, nunca *: con Allow-Credentials el navegador descarta la respuesta comodín
    @Value("${app.front.url}")
    private String frontURL;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        response.setHeader("Access-Control-Allow-Origin", frontURL);
        //Sin esta cabecera la cookie jwt no viaja ni se guarda
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        //Sin exponer Location, el frontend no puede leer el id creado en un 201 entre orígenes
        response.setHeader("Access-Control-Expose-Headers", HttpHeaders.SET_COOKIE + ", " + HttpHeaders.LOCATION);
        response.setHeader("Access-Control-Max-Age", "3600");

        //El preflight se responde aquí mismo, no baja a la cadena de seguridad
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }
}

