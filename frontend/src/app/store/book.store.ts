import { computed, inject, Service } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Book } from "../model/book";
import { BookService } from "../services/book.service";

//GET /v1/books no tiene /pageable: el catálogo llega entero y la tabla pagina y filtra en el cliente.
@Service({autoProvided: false})
export class BookStore{

    private readonly bookService = inject(BookService);

    readonly booksResource = httpResource<Book[]>(
        () => this.bookService.resourceUrl,
        { defaultValue: [] },
    );

    //value() lanza con el recurso en error: hasValue() lo evita
    readonly $books = computed(() =>
        this.booksResource.hasValue() ? this.booksResource.value() : [],
    );
    readonly $loading = this.booksResource.isLoading;
    readonly $error = this.booksResource.error;

    readonly $categoriasPresentes = computed(() => {
        const nombres = new Map<number, string>();

        for (const book of this.$books()) {
            if (book.idCategory && book.categoryName) {
                nombres.set(book.idCategory, book.categoryName);
            }
        }

        return [...nombres].map(([idCategory, name]) => ({ idCategory, name }));
    });

    reload(){
        this.booksResource.reload();
    }
}
