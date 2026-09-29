package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookDTO {

    private Integer idBook;

    @NotBlank(message = "{book.title.required}")
    @Size(min = 1, max = 150, message = "{book.title.size}")
    private String title;

    @NotBlank(message = "{book.author.required}")
    @Size(min = 1, max = 100, message = "{book.author.size}")
    private String author;

    @NotBlank(message = "{book.isbn.required}")
    @Size(min = 10, max = 13, message = "{book.isbn.size}")
    private String isbn;

    @NotNull(message = "{book.available.required}")
    private Boolean available;

    @NotNull(message = "{book.category.required}")
    private Integer idCategory;

    //Solo lectura
    private String categoryName;
}
