export class Book {
    idBook: number;
    title: string;
    author: string;
    isbn: string;
    //Disponible / Reservado en pantalla
    available: boolean;
    idCategory: number;
    //Solo lectura
    categoryName?: string;
}
