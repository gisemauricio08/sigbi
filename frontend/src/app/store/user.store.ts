import { computed, inject, Service } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { User } from "../model/user";
import { UserService } from "../services/user.service";

@Service({autoProvided: false})
export class UserStore{

    private readonly userService = inject(UserService);

    readonly usersResource = httpResource<User[]>(
        () => this.userService.resourceUrl,
        { defaultValue: [] },
    );

    //value() lanza con el recurso en error: hasValue() lo evita
    readonly $users = computed(() =>
        this.usersResource.hasValue() ? this.usersResource.value() : [],
    );
    readonly $loading = this.usersResource.isLoading;
    readonly $error = this.usersResource.error;

    reload(){
        this.usersResource.reload();
    }
}
