package com.sigbi.repo;

import com.sigbi.model.User;

import java.util.Optional;

public interface IUserRepo extends IGenericRepo<User, Integer> {

    Optional<User> findOneByUsername(String username);

    //El sub del token es el identificador que une Supabase con user_data: los emails cambian, el sub no
    Optional<User> findOneBySupabaseUserId(String supabaseUserId);

    //R-5
    long countByEnabledTrueAndRolesName(String roleName);
}
