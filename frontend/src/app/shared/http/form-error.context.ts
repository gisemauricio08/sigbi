import { HttpContext, HttpContextToken } from "@angular/common/http";

//Marca para que serverErrorInterceptor devuelva el 400 al formulario en vez de convertirlo en aviso.
export const ERROR_DE_FORMULARIO = new HttpContextToken<boolean>(() => false);

export const contextoDeFormulario = () => new HttpContext().set(ERROR_DE_FORMULARIO, true);
