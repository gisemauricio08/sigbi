import { Service } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Role } from '../model/role';
import { GenericService } from './generic.service';

//Solo lectura: los roles son fijos (R-3)
@Service()
export class RoleService extends GenericService<Role> {

    protected override url = `${environment.HOST}/v1/roles`;
}
