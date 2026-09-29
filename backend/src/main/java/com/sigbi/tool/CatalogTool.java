package com.sigbi.tool;

import com.sigbi.model.Book;
import com.sigbi.service.IBookService;
import com.sigbi.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

//Solo lectura, como ReservationTool. Los filtros van en memoria sobre findAll(): el catálogo es pequeño
@Component
@RequiredArgsConstructor
public class CatalogTool {

    //Más filas no caben en una respuesta útil del modelo
    private static final int MAXIMO = 25;

    private final IBookService bookService;
    private final ICategoryService categoryService;

    //Sin identificadores: si los recibe, el modelo tiende a citarlos
    public record LibroInfo(String titulo, String autor, String isbn, String categoria, String disponibilidad) {}

    public record CategoriaInfo(String nombre, String descripcion, String estado, long libros) {}

    @Tool(name = "listarLibros",
          description = "Lista los libros del catálogo, con su autor, categoría y si están disponibles o reservados")
    public List<LibroInfo> listarLibros() throws Exception {
        return bookService.findAll().stream().map(this::aInfo).limit(MAXIMO).toList();
    }

    @Tool(name = "buscarLibros",
          description = "Busca libros cuyo título o autor contenga el texto indicado")
    public List<LibroInfo> buscarLibros(String texto) throws Exception {
        String aguja = texto == null ? "" : texto.toLowerCase().trim();

        return bookService.findAll().stream()
                .filter(libro -> libro.getTitle().toLowerCase().contains(aguja)
                        || libro.getAuthor().toLowerCase().contains(aguja))
                .map(this::aInfo)
                .limit(MAXIMO)
                .toList();
    }

    @Tool(name = "buscarLibrosPorCategoria",
          description = "Lista los libros de una categoría, buscándola por su nombre. Si se indica soloDisponibles, omite los que están reservados")
    public List<LibroInfo> buscarLibrosPorCategoria(String categoria, boolean soloDisponibles) throws Exception {
        String aguja = categoria == null ? "" : categoria.toLowerCase().trim();

        return bookService.findAll().stream()
                .filter(libro -> libro.getCategory() != null
                        && libro.getCategory().getName().toLowerCase().contains(aguja))
                .filter(libro -> !soloDisponibles || Boolean.TRUE.equals(libro.getAvailable()))
                .map(this::aInfo)
                .limit(MAXIMO)
                .toList();
    }

    @Tool(name = "listarLibrosDisponibles",
          description = "Lista solo los libros que ahora mismo se pueden reservar, es decir los que no están reservados")
    public List<LibroInfo> listarLibrosDisponibles() throws Exception {
        return bookService.findAll().stream()
                .filter(libro -> Boolean.TRUE.equals(libro.getAvailable()))
                .map(this::aInfo)
                .limit(MAXIMO)
                .toList();
    }

    @Tool(name = "listarCategorias",
          description = "Lista las categorías del catálogo con cuántos libros tiene cada una y si están activas")
    public List<CategoriaInfo> listarCategorias() throws Exception {
        Map<Integer, Long> conteos = categoryService.bookCountByCategory();

        return categoryService.findAll().stream()
                .map(categoria -> new CategoriaInfo(
                        categoria.getName(),
                        categoria.getDescription(),
                        Boolean.TRUE.equals(categoria.getStatus()) ? "Activa" : "Inactiva",
                        conteos.getOrDefault(categoria.getIdCategory(), 0L)))
                .sorted(Comparator.comparing(CategoriaInfo::nombre))
                .toList();
    }

    private LibroInfo aInfo(Book libro) {
        return new LibroInfo(
                libro.getTitle(),
                libro.getAuthor(),
                libro.getIsbn(),
                libro.getCategory() != null ? libro.getCategory().getName() : "Sin categoría",
                //Mismos rótulos que la interfaz
                Boolean.TRUE.equals(libro.getAvailable()) ? "Disponible" : "Reservado");
    }
}
