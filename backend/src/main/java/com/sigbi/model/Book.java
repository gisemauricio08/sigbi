package com.sigbi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer idBook;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 100)
    private String author;

    @Column(nullable = false, length = 13, unique = true)
    private String isbn;

    //Lo cambia el servicio de reservas (RN-07, RN-13), nunca el cliente
    @Column(nullable = false)
    private Boolean available;

    @ManyToOne
    @JoinColumn(name = "id_category", nullable = false,
            foreignKey = @ForeignKey(name = "FK_BOOK_CATEGORY"))
    private Category category;
}
