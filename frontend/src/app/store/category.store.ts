import { computed, inject, Service } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Category } from "../model/category";
import { CategoryService } from "../services/category.service";

@Service({autoProvided: false})
export class CategoryStore{

    private readonly categoryService = inject(CategoryService);

    readonly categoriesResource = httpResource<Category[]>(
        () => this.categoryService.resourceUrl,
        { defaultValue: [] },
    );

    //value() lanza con el recurso en error: hasValue() lo evita
    readonly $categories = computed(() =>
        this.categoriesResource.hasValue() ? this.categoriesResource.value() : [],
    );
    readonly $loading = this.categoriesResource.isLoading;
    readonly $error = this.categoriesResource.error;

    readonly $activas = computed(() => this.$categories().filter((c) => c.status));

    reload(){
        this.categoriesResource.reload();
    }
}
