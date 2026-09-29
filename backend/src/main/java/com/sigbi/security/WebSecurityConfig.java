package com.sigbi.security;

import com.sigbi.model.Role;
import com.sigbi.model.User;
import com.sigbi.repo.IUserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

    //Solo existe uno de los dos resolvers, el que habilite app.auth.mode
    private final BearerTokenResolver bearerTokenResolver;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final IUserRepo userRepo;

    @Value("${app.auth.enabled:true}")
    private boolean authEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                //API stateless para una SPA: sin formulario ni token CSRF
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable);

        if (!authEnabled) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        //R-2. Gana la primera regla que encaja: lo exclusivo de ADMIN va antes que /v1/**.
        //Autoridades sin prefijo ROLE_ (hasAuthority, no hasRole)
        http
                .authorizeHttpRequests(auth -> auth
                        //Sin token: el logout limpia la cookie aunque el token haya caducado
                        .requestMatchers("/login/**", "/auth/logout").permitAll()
                        //Con token basta, tenga rol o no: así el frontend sabe qué mostrar
                        .requestMatchers("/auth/user").authenticated()
                        .requestMatchers("/v1/users/**", "/v1/roles/**", "/v1/admin/**").hasAuthority(Role.ADMIN)
                        //R-1: el token no basta. Sin fila en user_data, sin rol o deshabilitado, 403
                        .requestMatchers("/v1/**").hasAnyAuthority(Role.ADMIN, Role.BIBLIOTECARIO)
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler)
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(bearerTokenResolver)
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );

        return http.build();
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter scopesConverter = new JwtGrantedAuthoritiesConverter();

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        //authentication.getName() pasa a ser el email en vez del uuid: de ahí sale GET /auth/user
        converter.setPrincipalClaimName("email");
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>();

            Collection<GrantedAuthority> scopes = scopesConverter.convert(jwt);
            if (scopes != null) {
                authorities.addAll(scopes);
            }

            authorities.addAll(getRoleAuthorities(jwt));
            authorities.addAll(getLocalRoleAuthorities(jwt));

            return authorities;
        });

        return converter;
    }

    //El claim role de Supabase vale authenticated para todos, no distingue un ADMIN de un USER
    private Collection<GrantedAuthority> getRoleAuthorities(Jwt jwt) {
        String role = jwt.getClaimAsString("role");

        if (role == null || role.isBlank()) {
            return List.of();
        }

        return List.of(new SimpleGrantedAuthority(role));
    }

    //Roles locales: cambiarlos no exige reemitir el token, a cambio de una consulta a user_data por petición
    private Collection<GrantedAuthority> getLocalRoleAuthorities(Jwt jwt) {
        return userRepo.findOneBySupabaseUserId(jwt.getSubject())
                //enabled = false deja el token válido pero sin ninguna autoridad local
                .filter(User::isEnabled)
                .map(User::getRoles)
                .orElseGet(List::of)
                .stream()
                .map(Role::getName)
                .map(name -> (GrantedAuthority) new SimpleGrantedAuthority(name))
                .toList();
    }
}
