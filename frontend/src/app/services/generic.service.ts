import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { contextoDeFormulario } from '../shared/http/form-error.context';

@Service({autoProvided: false})
export abstract class GenericService<T> {
    protected http = inject(HttpClient);
    protected abstract url: string;

    get resourceUrl(){
        return this.url;
    }

    findAll(){
        return this.http.get<T[]>(this.url);
    }

    findById(id: number){
        return this.http.get<T>(`${this.url}/${id}`);
    }

    save(t: T){
        return this.http.post(this.url, t);
    }

    update(id: number, t: T){
        return this.http.put(`${this.url}/${id}`, t);
    }

    //Devuelven el 400 al diálogo para pintarlo bajo su campo (ver form-error.context.ts)
    saveWithFormErrors(t: T){
        return this.http.post(this.url, t, { context: contextoDeFormulario() });
    }

    updateWithFormErrors(id: number, t: T){
        return this.http.put(`${this.url}/${id}`, t, { context: contextoDeFormulario() });
    }

    delete(id: number){
        return this.http.delete(`${this.url}/${id}`);
    }
}
