import { computed, inject, Service, signal } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Book } from "../model/book";
import { BookService } from "../services/book.service";

//Sin id (alta) la url es undefined y httpResource no hace ninguna petición.
@Service({ autoProvided: false })
export class BookDialogStore{

    private readonly bookService = inject(BookService);
    readonly $id = signal<number | null>(null);

    private readonly $request = computed(() => {
        const id = this.$id();

        return id ? `${this.bookService.resourceUrl}/${id}` : undefined;
    });

    readonly bookResource = httpResource<Book>(() => this.$request());

    setId(id: number | null){
        this.$id.set(id);
    }
}
