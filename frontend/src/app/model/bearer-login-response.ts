//Cuerpo de /login/bearer; en modo cookie el token no llega a JavaScript
export interface BearerLoginResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}
