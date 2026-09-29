package com.sigbi.service.impl;

import com.sigbi.dto.AdminUserRequest;
import com.sigbi.exception.BusinessRuleException;
import com.sigbi.model.Role;
import com.sigbi.model.User;
import com.sigbi.repo.IUserRepo;
import com.sigbi.security.ISupabaseService;
import com.sigbi.security.SupabaseUser;
import com.sigbi.service.AdminUserCreation;
import com.sigbi.service.IAdminUserService;
import com.sigbi.service.IRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements IAdminUserService {

    private final IUserRepo userRepo;
    private final IRoleService roleService;
    private final ISupabaseService supabaseService;
    private final MessageSource messageSource;

    @Transactional
    @Override
    public AdminUserCreation create(AdminUserRequest request) {
        //R-8. Supabase guarda el correo en minúsculas
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepo.findOneByUsername(email).isPresent()) {
            throw new BusinessRuleException(message("user.email.duplicated", email));
        }

        //R-7 antes de tocar Supabase: un rol inexistente dejaría una identidad huérfana
        List<Role> roles = roleService.findByNames(request.getRoles());

        //R-10: si la identidad ya existe en Supabase se vincula y conserva su contraseña
        Optional<SupabaseUser> existing = supabaseService.findAuthUserByEmail(email);

        //Otro username con el mismo sub sería la misma persona con dos cuentas locales
        if (existing.isPresent() && userRepo.findOneBySupabaseUserId(existing.get().id()).isPresent()) {
            throw new BusinessRuleException(message("user.email.duplicated", email));
        }

        boolean linked = existing.isPresent();
        SupabaseUser supabaseUser = linked ? existing.get() : supabaseService.createAuthUser(email, request.getPassword());

        User user = new User();
        user.setUsername(email);
        user.setSupabaseUserId(supabaseUser.id());
        user.setEnabled(true);
        user.setRoles(new ArrayList<>(roles));

        try {
            //saveAndFlush: si el insert falla tiene que ser aquí, no en el commit, para poder registrarlo
            return new AdminUserCreation(userRepo.saveAndFlush(user), linked);
        } catch (RuntimeException e) {
            //Una identidad recién creada queda huérfana y se limpia a mano en Supabase; una vinculada (R-10) no
            if (!linked) {
                log.error("USER_DATA NOT SAVED, SUPABASE IDENTITY LEFT ORPHAN: {}", supabaseUser.id(), e);
            }
            throw e;
        }
    }

    private String message(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }
}
