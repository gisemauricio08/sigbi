import { AuthMode } from '../app/model/auth-mode';

export const environment = {
    //URL del backend, sin barra final
    HOST: 'http://localhost:8080',
    RETRY: 2,
    //Igual que app.auth.mode del backend, o todo responde 401
    AUTH_MODE: 'bearer' as AuthMode,
    //Igual que app.auth.enabled del backend; false se comporta como ADMIN
    AUTH_ENABLED: true
};
