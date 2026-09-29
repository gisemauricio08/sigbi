import { Service } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Book } from '../model/book';
import { GenericService } from './generic.service';

@Service()
export class BookService extends GenericService<Book> {

    protected override url = `${environment.HOST}/v1/books`;
}
