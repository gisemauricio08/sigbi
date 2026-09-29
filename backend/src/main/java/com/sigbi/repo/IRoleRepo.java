package com.sigbi.repo;

import com.sigbi.model.Role;

import java.util.List;
import java.util.Optional;

public interface IRoleRepo extends IGenericRepo<Role, Integer> {

    List<Role> findByNameIn(List<String> names);

    Optional<Role> findOneByName(String name);
}
