import { computed, inject, Service, signal } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Reservation } from "../model/reservation";
import { ReservationService } from "../services/reservation.service";

//El filtro por cliente cambia de endpoint (/client/{id}) en vez de filtrar en memoria.
@Service({autoProvided: false})
export class ReservationStore{

    private readonly reservationService = inject(ReservationService);

    readonly $idClient = signal<number | null>(null);

    readonly reservationsResource = httpResource<Reservation[]>(
        () => {
            const idClient = this.$idClient();

            return idClient
                ? `${this.reservationService.resourceUrl}/client/${idClient}`
                : this.reservationService.resourceUrl;
        },
        { defaultValue: [] },
    );

    readonly $reservations = computed(() =>
        [...(this.reservationsResource.hasValue() ? this.reservationsResource.value() : [])].sort((a, b) =>
            (b.reservationDate ?? '').localeCompare(a.reservationDate ?? ''),
        ),
    );

    readonly $loading = this.reservationsResource.isLoading;
    readonly $error = this.reservationsResource.error;

    filtrarPorCliente(idClient: number | null){
        this.$idClient.set(idClient);
    }

    reload(){
        this.reservationsResource.reload();
    }
}
