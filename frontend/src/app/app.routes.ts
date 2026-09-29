import { Routes } from '@angular/router';
import { environment } from '../environments/environment.development';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { Not403Component } from './pages/not-403/not-403.component';
import { Not404Component } from './pages/not-404/not-404.component';

export const routes: Routes = [
    { path: '', redirectTo: environment.AUTH_ENABLED ? 'login' : 'pages/dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { 
        path: 'pages',
        component: LayoutComponent,
        loadChildren: () => import('./pages/pages.routes').then(m => m.pagesRoutes)
    },
    //Fuera del shell: sin menú de navegación
    { path: '403', component: Not403Component },
    {
        path: '**', component: Not404Component
    }
];
