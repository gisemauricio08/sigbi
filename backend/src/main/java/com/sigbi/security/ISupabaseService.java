package com.sigbi.security;

import java.util.Optional;

public interface ISupabaseService {

    SupabaseSession login(String username, String password);

    SupabaseUser createAuthUser(String email, String password);

    //R-10
    Optional<SupabaseUser> findAuthUserByEmail(String email);

    void logout(String accessToken);
}
