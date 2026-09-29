package com.sigbi.service.impl;

import com.sigbi.exception.BusinessRuleException;
import com.sigbi.model.Role;
import com.sigbi.model.User;
import com.sigbi.repo.IGenericRepo;
import com.sigbi.repo.IUserRepo;
import com.sigbi.service.IRoleService;
import com.sigbi.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

//El alta la hace AdminUserServiceImpl, que crea antes la identidad en Supabase
@Service
@RequiredArgsConstructor
public class UserServiceImpl extends CRUDImpl<User, Integer> implements IUserService {

    private final IUserRepo repo;
    private final IRoleService roleService;
    private final MessageSource messageSource;

    @Override
    protected IGenericRepo<User, Integer> getRepo() {
        return repo;
    }

    //username y supabaseUserId no se tocan: los fija Supabase. Del cuerpo solo cuentan enabled y roles
    @Transactional
    @Override
    public User update(Integer id, User entity) throws Exception {
        User user = findById(id);

        //R-7
        List<String> names = entity.getRoles() == null ? List.of()
                : entity.getRoles().stream().map(Role::getName).toList();
        List<Role> roles = roleService.findByNames(names);

        boolean wasActiveAdmin = user.isEnabled() && hasAdmin(user.getRoles());
        boolean staysActiveAdmin = entity.isEnabled() && hasAdmin(roles);

        if (wasActiveAdmin && !staysActiveAdmin) {
            //R-6
            if (isCurrentUser(user)) {
                throw new BusinessRuleException(message("user.self.admin"));
            }

            //R-5: el editado todavía cuenta, así que tiene que haber otro
            if (repo.countByEnabledTrueAndRolesName(Role.ADMIN) <= 1) {
                throw new BusinessRuleException(message("user.lastAdmin"));
            }
        }

        user.setEnabled(entity.isEnabled());
        user.setRoles(new ArrayList<>(roles));

        return repo.save(user);
    }

    private boolean hasAdmin(List<Role> roles) {
        return roles != null && roles.stream().anyMatch(role -> Role.ADMIN.equals(role.getName()));
    }

    //Con AUTH_ENABLED=false no hay token y nadie es "el usuario actual": R-6 no aplica, R-5 sí
    private boolean isCurrentUser(User user) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication instanceof JwtAuthenticationToken jwtAuthentication
                && jwtAuthentication.getToken().getSubject().equals(user.getSupabaseUserId());
    }

    private String message(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }
}
