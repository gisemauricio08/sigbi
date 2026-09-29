import { RoleName } from "../../model/role";

const ETIQUETAS: Record<RoleName, string> = {
    ADMIN: 'Administrador',
    BIBLIOTECARIO: 'Bibliotecario',
};

//Un rol desconocido se muestra tal cual antes que desaparecer
export function etiquetaDeRol(rol: string): string {
    return ETIQUETAS[rol as RoleName] ?? rol;
}
