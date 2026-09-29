package com.sigbi.controller;

import com.sigbi.dto.CategoryDTO;
import com.sigbi.model.Category;
import com.sigbi.service.ICategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/categories")
public class CategoryController {

    private final ICategoryService service;
    private final ModelMapper defaultMapper;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> findAll() throws Exception {
        Map<Integer, Long> counts = service.bookCountByCategory();

        List<CategoryDTO> list = service.findAll().stream()
                .map(obj -> {
                    CategoryDTO dto = convertToDto(obj);
                    dto.setBookCount(counts.getOrDefault(obj.getIdCategory(), 0L));
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> findById(@PathVariable Integer id) throws Exception {
        CategoryDTO dto = convertToDto(service.findById(id));
        dto.setBookCount(service.countBooks(id));

        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<Void> save(@Valid @RequestBody CategoryDTO dto) throws Exception {
        Category obj = service.save(convertToEntity(dto));

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(obj.getIdCategory()).toUri();

        return ResponseEntity.created(location).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> update(@PathVariable Integer id,
                                              @Valid @RequestBody CategoryDTO dto) throws Exception {
        return ResponseEntity.ok(convertToDto(service.update(id, convertToEntity(dto))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) throws Exception {
        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    private Category convertToEntity(CategoryDTO dto) {
        return defaultMapper.map(dto, Category.class);
    }

    private CategoryDTO convertToDto(Category obj) {
        return defaultMapper.map(obj, CategoryDTO.class);
    }
}
