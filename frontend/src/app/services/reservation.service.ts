import { Service } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Reservation } from '../model/reservation';
import { GenericService } from './generic.service';

@Service()
export class ReservationService extends GenericService<Reservation> {

    protected override url = `${environment.HOST}/v1/reservations`;

    //No hay PUT: una reserva se crea o se elimina.
    findByClient(idClient: number) {
        return this.http.get<Reservation[]>(`${this.url}/client/${idClient}`);
    }

    //El POST responde 201 sin cuerpo: el id llega en la cabecera Location.
    saveAndGetId(reservation: Reservation) {
        return this.http.post(this.url, reservation, { observe: 'response' }).pipe(
            map((respuesta) => {
                const location = respuesta.headers.get('Location');

                return location ? Number(location.split('/').pop()) : null;
            }),
        );
    }
}
