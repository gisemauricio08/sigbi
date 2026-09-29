package com.sigbi.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

//Respuesta cruda de /auth/v1/token, tal cual la manda Supabase
@JsonIgnoreProperties(ignoreUnknown = true)
public record SupabaseSession(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("refresh_token") String refreshToken,
        @JsonProperty("expires_in") Long expiresIn,
        @JsonProperty("expires_at") Long expiresAt,
        @JsonProperty("token_type") String tokenType,
        SupabaseUser user
) {
}
