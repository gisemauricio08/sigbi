//Fijos: los crea el backend al arrancar (R-3)
export type RoleName = 'ADMIN' | 'BIBLIOTECARIO';

export class Role {
    idRole: number;
    name: RoleName;
    description: string;
}
