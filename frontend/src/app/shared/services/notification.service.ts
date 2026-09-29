import { Service, signal } from "@angular/core";

@Service()
export class NotificationService{

    private readonly _message = signal('');
    readonly $message = this._message.asReadonly();

    notify(message: string){
        this._message.set(message);
    }

    clear(){
        this._message.set('');
    }

}