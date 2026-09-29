export class Category {
    idCategory: number;
    name: string;
    description: string;
    //Activa / Inactiva en pantalla
    status: boolean;
    //Solo lectura: lo calcula el backend
    bookCount?: number;
}
