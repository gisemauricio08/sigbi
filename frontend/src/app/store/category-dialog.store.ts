import { computed, inject, Service, signal } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Category } from "../model/category";
import { CategoryService } from "../services/category.service";

//Sin id (alta) la url es undefined y httpResource no hace ninguna petición.
@Service({ autoProvided: false })
export class CategoryDialogStore{

    private readonly categoryService = inject(CategoryService);
    readonly $id = signal<number | null>(null);

    private readonly $request = computed(() => {
        const id = this.$id();

        return id ? `${this.categoryService.resourceUrl}/${id}` : undefined;
    });

    readonly categoryResource = httpResource<Category>(() => this.$request());

    setId(id: number | null){
        this.$id.set(id);
    }
}
