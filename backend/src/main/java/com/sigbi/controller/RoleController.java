package com.sigbi.controller;

import com.sigbi.dto.RoleDTO;
import com.sigbi.model.Role;
import com.sigbi.service.IRoleService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

//Solo lectura (R-3)
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/roles")
public class RoleController {

    private final IRoleService service;
    private final ModelMapper defaultMapper;

    @GetMapping
    public ResponseEntity<List<RoleDTO>> findAll() throws Exception {
        List<RoleDTO> list = service.findAll().stream().map(this::convertToDto).toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> findById(@PathVariable Integer id) throws Exception {
        RoleDTO obj = convertToDto(service.findById(id));

        return ResponseEntity.ok(obj);
    }

    private RoleDTO convertToDto(Role obj) {
        return defaultMapper.map(obj, RoleDTO.class);
    }
}
