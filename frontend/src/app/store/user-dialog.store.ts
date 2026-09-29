import { computed, inject, Service } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Role } from "../model/role";
import { RoleService } from "../services/role.service";

//No hay GET /v1/users/{id}: el usuario que se edita llega entero desde la fila de la tabla.
@Service({ autoProvided: false })
export class UserDialogStore{

    private readonly roleService = inject(RoleService);

    readonly rolesResource = httpResource<Role[]>(
        () => this.roleService.resourceUrl,
        { defaultValue: [] },
    );

    readonly $roles = computed(() =>
        this.rolesResource.hasValue() ? this.rolesResource.value() : [],
    );
    readonly $loading = this.rolesResource.isLoading;
    readonly $error = this.rolesResource.error;

    reload(){
        this.rolesResource.reload();
    }
}
