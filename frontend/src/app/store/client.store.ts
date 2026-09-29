import { computed, inject, Service } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Client } from "../model/client";
import { ClientService } from "../services/client.service";

@Service({autoProvided: false})
export class ClientStore{

    private readonly clientService = inject(ClientService);

    readonly clientsResource = httpResource<Client[]>(
        () => this.clientService.resourceUrl,
        { defaultValue: [] },
    );

    //value() lanza con el recurso en error: hasValue() lo evita
    readonly $clients = computed(() =>
        this.clientsResource.hasValue() ? this.clientsResource.value() : [],
    );
    readonly $loading = this.clientsResource.isLoading;
    readonly $error = this.clientsResource.error;

    reload(){
        this.clientsResource.reload();
    }
}
