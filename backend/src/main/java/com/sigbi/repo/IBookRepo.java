package com.sigbi.repo;

import com.sigbi.model.Book;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface IBookRepo extends IGenericRepo<Book, Integer> {

    Optional<Book> findByIsbn(String isbn);

    long countByCategoryIdCategory(Integer idCategory);

    //Una sola consulta para todo el listado; un GROUP BY no se deriva del nombre
    @Query("SELECT b.category.idCategory, COUNT(b) FROM Book b GROUP BY b.category.idCategory")
    List<Object[]> countGroupedByCategory();
}
