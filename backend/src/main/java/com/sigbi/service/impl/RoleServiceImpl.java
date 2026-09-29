package com.sigbi.service.impl;

import com.sigbi.exception.BusinessRuleException;
import com.sigbi.model.Role;
import com.sigbi.repo.IGenericRepo;
import com.sigbi.repo.IRoleRepo;
import com.sigbi.service.IRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl extends CRUDImpl<Role, Integer> implements IRoleService {

    private final IRoleRepo repo;
    private final MessageSource messageSource;

    @Override
    protected IGenericRepo<Role, Integer> getRepo() {
        return repo;
    }

    @Override
    public List<Role> findByNames(List<String> names) {
        List<String> distinctNames = names == null ? List.of() : names.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .distinct()
                .toList();

        if (distinctNames.isEmpty()) {
            throw new BusinessRuleException(message("user.roles.required"));
        }

        List<Role> roles = repo.findByNameIn(distinctNames);

        if (roles.size() != distinctNames.size()) {
            List<String> found = roles.stream().map(Role::getName).toList();
            String missing = distinctNames.stream()
                    .filter(name -> !found.contains(name))
                    .findFirst()
                    .orElse("");

            throw new BusinessRuleException(message("user.role.notFound", missing));
        }

        return roles;
    }

    private String message(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }
}
