package com.sigbi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

//R-3: fijos; los crea el arranque y WebSecurityConfig los nombra
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
public class Role {

    public static final String ADMIN = "ADMIN";
    public static final String BIBLIOTECARIO = "BIBLIOTECARIO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer idRole;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, length = 150)
    private String description;
}
