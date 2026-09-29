package com.sigbi.security;

import com.sigbi.dto.AdminUserRequest;
import com.sigbi.model.Role;
import com.sigbi.repo.IRoleRepo;
import com.sigbi.repo.IUserRepo;
import com.sigbi.service.IAdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

//El primer ADMIN no puede crearse por la API, que exige ser ADMIN.
//Idempotente; un fallo se registra y no tumba el arranque
@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityBootstrap implements ApplicationRunner {

    private final IRoleRepo roleRepo;
    private final IUserRepo userRepo;
    private final IAdminUserService adminUserService;

    @Value("${app.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureRole(Role.ADMIN, "Gestiona las cuentas y opera el sistema");
            ensureRole(Role.BIBLIOTECARIO, "Opera catálogo, clientes, reservas y asistente");
        } catch (Exception e) {
            log.warn("BOOTSTRAP ROLES NOT CREATED: {}", e.getMessage());
            return;
        }

        try {
            ensureAdmin();
        } catch (Exception e) {
            log.warn("BOOTSTRAP ADMIN NOT CREATED: {}", e.getMessage());
        }
    }

    private void ensureRole(String name, String description) {
        if (roleRepo.findOneByName(name).isEmpty()) {
            roleRepo.save(new Role(null, name, description));
            log.info("BOOTSTRAP ROLE CREATED: {}", name);
        }
    }

    //Si ya hay un ADMIN habilitado las variables no se miran: cambiarlas no crea un segundo
    private void ensureAdmin() {
        if (userRepo.countByEnabledTrueAndRolesName(Role.ADMIN) > 0) {
            return;
        }

        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("NO ENABLED ADMIN AND BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD NOT SET");
            return;
        }

        //Mismo camino que POST /v1/admin/users. Si la identidad ya existía (R-10),
        //conserva su contraseña y BOOTSTRAP_ADMIN_PASSWORD no se aplica
        boolean linked = adminUserService.create(new AdminUserRequest(adminEmail, adminPassword, List.of(Role.ADMIN))).linked();
        log.info(linked ? "BOOTSTRAP ADMIN LINKED TO EXISTING SUPABASE IDENTITY" : "BOOTSTRAP ADMIN CREATED");
    }
}
