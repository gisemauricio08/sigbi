import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { paginadorEnEspanol } from './shared/services/paginator-intl';
import { bearerTokenInterceptor } from './interceptor/bearer-token.interceptor';
import { credentialsInterceptor } from './interceptor/credentials.interceptor';
import { serverErrorInterceptor } from './interceptor/server-error.interceptor';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      //El orden importa: serverErrorInterceptor va último para envolver a los otros dos
      withInterceptors([credentialsInterceptor, bearerTokenInterceptor, serverErrorInterceptor])
    ),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    //index.html carga Material Symbols; sin esto mat-icon buscaría Material Icons y no se vería nada
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
    { provide: MatPaginatorIntl, useFactory: paginadorEnEspanol },
  ]
};
