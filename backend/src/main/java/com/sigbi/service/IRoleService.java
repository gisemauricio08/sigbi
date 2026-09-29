package com.sigbi.service;

import com.sigbi.model.Role;

import java.util.List;

public interface IRoleService extends ICRUD<Role, Integer> {

    //R-7. La comparten el alta y la edición de usuarios
    List<Role> findByNames(List<String> names);
}
