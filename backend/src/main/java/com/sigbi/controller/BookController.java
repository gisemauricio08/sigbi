package com.sigbi.controller;

import com.sigbi.dto.BookDTO;
import com.sigbi.model.Book;
import com.sigbi.model.Category;
import com.sigbi.service.IBookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/books")
public class BookController {

    private final IBookService service;

    @GetMapping
    public ResponseEntity<List<BookDTO>> findAll() throws Exception {
        List<BookDTO> list = service.findAll().stream().map(this::convertToDto).toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> findById(@PathVariable Integer id) throws Exception {
        return ResponseEntity.ok(convertToDto(service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<Void> save(@Valid @RequestBody BookDTO dto) throws Exception {
        Book obj = service.save(convertToEntity(dto));

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(obj.getIdBook()).toUri();

        return ResponseEntity.created(location).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookDTO> update(@PathVariable Integer id,
                                          @Valid @RequestBody BookDTO dto) throws Exception {
        return ResponseEntity.ok(convertToDto(service.update(id, convertToEntity(dto))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) throws Exception {
        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    //Mapeo a mano: ModelMapper no resuelve idCategory del DTO a la Category de la entidad
    private Book convertToEntity(BookDTO dto) {
        Category category = new Category();
        category.setIdCategory(dto.getIdCategory());

        Book obj = new Book();
        obj.setIdBook(dto.getIdBook());
        obj.setTitle(dto.getTitle());
        obj.setAuthor(dto.getAuthor());
        obj.setIsbn(dto.getIsbn());
        obj.setAvailable(dto.getAvailable());
        obj.setCategory(category);

        return obj;
    }

    private BookDTO convertToDto(Book obj) {
        BookDTO dto = new BookDTO();
        dto.setIdBook(obj.getIdBook());
        dto.setTitle(obj.getTitle());
        dto.setAuthor(obj.getAuthor());
        dto.setIsbn(obj.getIsbn());
        dto.setAvailable(obj.getAvailable());

        if (obj.getCategory() != null) {
            dto.setIdCategory(obj.getCategory().getIdCategory());
            dto.setCategoryName(obj.getCategory().getName());
        }

        return dto;
    }
}
