package com.sigbi.service;

import com.sigbi.dto.AdminUserRequest;

public interface IAdminUserService {

    //La usan POST /v1/admin/users y SecurityBootstrap
    AdminUserCreation create(AdminUserRequest request);
}
