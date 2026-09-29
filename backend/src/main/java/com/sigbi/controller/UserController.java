package com.sigbi.controller;

import com.sigbi.dto.UserDTO;
import com.sigbi.model.User;
import com.sigbi.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//Sin POST ni DELETE: el alta es POST /v1/admin/users y un usuario se deshabilita, no se borra (R-4)
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/users")
public class UserController {

    private final IUserService service;
    private final ModelMapper defaultMapper;

    @GetMapping
    public ResponseEntity<List<UserDTO>> findAll() throws Exception {
        List<UserDTO> list = service.findAll().stream().map(this::convertToDto).toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> findById(@PathVariable Integer id) throws Exception {
        UserDTO obj = convertToDto(service.findById(id));

        return ResponseEntity.ok(obj);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> update(@PathVariable Integer id, @Valid @RequestBody UserDTO dto) throws Exception {
        User obj = service.update(id, convertToEntity(dto));

        return ResponseEntity.ok(convertToDto(obj));
    }

    private User convertToEntity(UserDTO dto) {
        return defaultMapper.map(dto, User.class);
    }

    private UserDTO convertToDto(User obj) {
        return defaultMapper.map(obj, UserDTO.class);
    }
}
