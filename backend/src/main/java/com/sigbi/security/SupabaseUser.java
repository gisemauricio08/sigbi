package com.sigbi.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

//Solo los campos usados: Supabase devuelve muchos más y cambian entre versiones
@JsonIgnoreProperties(ignoreUnknown = true)
public record SupabaseUser(
        String id,
        String email
) {
}
