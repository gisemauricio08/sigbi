package com.sigbi.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

//Una página de GET /auth/v1/admin/users
@JsonIgnoreProperties(ignoreUnknown = true)
public record SupabaseUserPage(
        List<SupabaseUser> users
) {
}
