package com.sigbi.security;

import com.fasterxml.jackson.annotation.JsonProperty;

//Sin el user de Supabase: el frontend no lo usa
public record BearerLoginResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("refresh_token") String refreshToken,
        @JsonProperty("expires_in") Long expiresIn,
        @JsonProperty("token_type") String tokenType
) {

    public static BearerLoginResponse from(SupabaseSession session) {
        return new BearerLoginResponse(
                session.accessToken(),
                session.refreshToken(),
                session.expiresIn(),
                session.tokenType()
        );
    }
}
