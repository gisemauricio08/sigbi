package com.sigbi.security;

import com.sigbi.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

//Único punto que habla con Supabase Auth. Las contraseñas viven allí, nunca en user_data
@Slf4j
@Service
@RequiredArgsConstructor
public class SupabaseServiceImpl implements ISupabaseService {

    private static final String API_KEY_HEADER = "apikey";
    private static final int USER_PAGE_SIZE = 200;
    private static final int MAX_USER_PAGES = 50;

    private final RestClient restClient = RestClient.create();
    private final MessageSource messageSource;

    @Value("${app.supabase.url}")
    private String supabaseUrl;

    //Clave pública: solo sirve para pedir el token con email y password
    @Value("${app.supabase.anon-key}")
    private String supabaseAnonKey;

    //Salta toda regla de seguridad de Supabase: solo crea y busca identidades, y nunca sale del servidor
    @Value("${app.supabase.service-role-key}")
    private String supabaseServiceRoleKey;

    @Override
    public SupabaseSession login(String username, String password) {
        try {
            return restClient.post()
                    .uri(supabaseUrl + "/auth/v1/token?grant_type=password")
                    .header(API_KEY_HEADER, supabaseAnonKey)
                    .body(Map.of("email", username, "password", password))
                    .retrieve()
                    .body(SupabaseSession.class);
        } catch (RestClientResponseException e) {
            //El motivo exacto se queda en el log, al cliente le llega un 401 sin cuerpo
            log.warn("SUPABASE LOGIN FAILED: {}", e.getResponseBodyAsString());
            throw new BadCredentialsException("INVALID CREDENTIALS");
        } catch (RestClientException e) {
            throw new BadCredentialsException("SUPABASE AUTH NOT AVAILABLE", e);
        }
    }

    //La API de administración no filtra por correo: se pagina. El tope de páginas evita
    //un bucle si Supabase devolviera siempre la misma
    @Override
    public Optional<SupabaseUser> findAuthUserByEmail(String email) {
        try {
            for (int page = 1; page <= MAX_USER_PAGES; page++) {
                SupabaseUserPage result = restClient.get()
                        .uri(supabaseUrl + "/auth/v1/admin/users?page={page}&per_page={size}", page, USER_PAGE_SIZE)
                        .header(API_KEY_HEADER, supabaseServiceRoleKey)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseServiceRoleKey)
                        .retrieve()
                        .body(SupabaseUserPage.class);

                List<SupabaseUser> users = result == null || result.users() == null ? List.of() : result.users();

                Optional<SupabaseUser> found = users.stream()
                        .filter(user -> email.equalsIgnoreCase(user.email()))
                        .findFirst();

                if (found.isPresent() || users.size() < USER_PAGE_SIZE) {
                    return found;
                }
            }

            return Optional.empty();
        } catch (RestClientException e) {
            throw new IllegalStateException(message("user.supabase.unavailable"), e);
        }
    }

    @Override
    public SupabaseUser createAuthUser(String email, String password) {
        try {
            //email_confirm deja al usuario activo sin pasar por el correo de confirmación
            return restClient.post()
                    .uri(supabaseUrl + "/auth/v1/admin/users")
                    .header(API_KEY_HEADER, supabaseServiceRoleKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseServiceRoleKey)
                    .body(Map.of(
                            "email", email,
                            "password", password,
                            "email_confirm", true
                    ))
                    .retrieve()
                    .body(SupabaseUser.class);
        } catch (RestClientResponseException e) {
            //R-9: 400 con motivo en español, no 500 con el cuerpo en inglés de Supabase
            String body = e.getResponseBodyAsString();
            log.warn("SUPABASE USER NOT CREATED: {}", body);

            if (body.contains("email_exists")) {
                throw new BusinessRuleException(message("user.email.duplicated", email));
            }

            if (body.contains("weak_password")) {
                throw new BusinessRuleException(message("user.supabase.weakPassword"));
            }

            throw new BusinessRuleException(message("user.supabase.rejected"));
        } catch (RestClientException e) {
            //Supabase caído no es una regla incumplida: sale por el manejador genérico
            throw new IllegalStateException(message("user.supabase.unavailable"), e);
        }
    }

    @Override
    public void logout(String accessToken) {
        try {
            restClient.post()
                    .uri(supabaseUrl + "/auth/v1/logout")
                    .header(API_KEY_HEADER, supabaseAnonKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new IllegalStateException("SUPABASE LOGOUT FAILED: " + e.getMessage(), e);
        }
    }

    private String message(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }
}
