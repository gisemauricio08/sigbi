import { Service, signal } from "@angular/core";
import { form, maxLength, minLength, required } from "@angular/forms/signals";
import { Category } from "../model/category";

const categoriaVacia = (): Category => ({
    idCategory: null,
    name: '',
    description: '',
    status: true,
    bookCount: undefined,
});

@Service({autoProvided: false})
export class CategoryForm {

    readonly $model = signal<Category>(categoriaVacia());

    readonly $form = form(this.$model, (path) => {
        required(path.name, { message: 'El nombre es obligatorio' });
        minLength(path.name, 3, { message: 'Al menos 3 caracteres' });
        maxLength(path.name, 60, { message: 'Como máximo 60 caracteres' });

        required(path.description, { message: 'La descripción es obligatoria' });
        minLength(path.description, 3, { message: 'Al menos 3 caracteres' });
        maxLength(path.description, 150, { message: 'Como máximo 150 caracteres' });
  });

  readonly isInvalid = () => this.$form().invalid();

  patch(category: Category){
    this.$model.set({ ...category });
  }

  value(){
    return this.$model();
  }

  reset(){
    this.$model.set(categoriaVacia());
  }
}
