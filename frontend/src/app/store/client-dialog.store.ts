import { computed, inject, Service, signal } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Client } from "../model/client";
import { ClientService } from "../services/client.service";

//Sin id (alta) la url es undefined y httpResource no hace ninguna petición.
@Service({ autoProvided: false })
export class ClientDialogStore{

    private readonly clientService = inject(ClientService);
    readonly $id = signal<number | null>(null);

    private readonly $request = computed(() => {
        const id = this.$id();

        return id ? `${this.clientService.resourceUrl}/${id}` : undefined;
    });

    readonly clientResource = httpResource<Client>(() => this.$request());

    setId(id: number | null){
        this.$id.set(id);
    }
}
