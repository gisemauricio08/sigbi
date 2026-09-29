import { Client } from './client';
import { ReservationDetail } from './reservation-detail';

export class Reservation {
    idReservation?: number;
    //RN-10: la pone el servidor; si se envía, se ignora
    reservationDate?: string;
    idClient: number;
    //Solo salida
    client?: Client;
    details: ReservationDetail[];
}
