import { Service, signal } from "@angular/core";
import { form, maxLength, minLength, pattern, required } from "@angular/forms/signals";
import { Book } from "../model/book";

const libroVacio = (): Book => ({
    idBook: null,
    title: '',
    author: '',
    isbn: '',
    //RN-07 lo cambia al reservarse, no el formulario
    available: true,
    idCategory: null,
    categoryName: undefined,
});

//Longitudes de BookDTO; el servidor sigue siendo el que manda.
@Service({autoProvided: false})
export class BookForm {

    readonly $model = signal<Book>(libroVacio());

    readonly $form = form(this.$model, (path) => {
        required(path.title, { message: 'El título es obligatorio' });
        maxLength(path.title, 150, { message: 'Como máximo 150 caracteres' });

        required(path.author, { message: 'El autor es obligatorio' });
        maxLength(path.author, 100, { message: 'Como máximo 100 caracteres' });

        required(path.isbn, { message: 'El ISBN es obligatorio' });
        minLength(path.isbn, 10, { message: 'El ISBN tiene entre 10 y 13 caracteres' });
        maxLength(path.isbn, 13, { message: 'El ISBN tiene entre 10 y 13 caracteres' });
        //La X final es el dígito de control del ISBN-10
        pattern(path.isbn, /^[0-9]{9,12}[0-9Xx]$/, { message: 'El ISBN solo admite dígitos, o una X final' });

        required(path.idCategory, { message: 'Elige una categoría' });
  });

  readonly isInvalid = () => this.$form().invalid();

  patch(book: Book){
    this.$model.set({ ...book });
  }

  value(){
    return this.$model();
  }

  reset(){
    this.$model.set(libroVacio());
  }
}
