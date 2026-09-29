import { Book } from './book';

export class ReservationDetail {
    idReservationDetail?: number;
    //Entrada
    idBook: number;
    //Salida: evita una segunda petición para mostrar el título
    book?: Book;
}
