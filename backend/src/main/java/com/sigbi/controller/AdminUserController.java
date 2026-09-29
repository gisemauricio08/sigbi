package com.sigbi.controller;

import com.sigbi.dto.AdminUserRequest;
import com.sigbi.dto.AdminUserResponse;
import com.sigbi.model.User;
import com.sigbi.service.AdminUserCreation;
import com.sigbi.service.IAdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/admin/users")
public class AdminUserController {

    private final IAdminUserService service;

    //Location apunta a /v1/users/{id}, donde se lee el usuario creado
    @PostMapping
    public ResponseEntity<AdminUserResponse> save(@Valid @RequestBody AdminUserRequest dto) throws Exception {
        AdminUserCreation creation = service.create(dto);
        User obj = creation.user();

        URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/v1/users/{id}")
                .buildAndExpand(obj.getIdUser()).toUri();

        return ResponseEntity.created(location)
                .body(new AdminUserResponse(obj.getIdUser(), obj.getUsername(), creation.linked()));
    }
}
