import { Routes } from "@angular/router";
import { PERSONAL, rolGuard, SOLO_ADMIN } from "../guards/rol.guard";
import { BookComponent } from "./book/book.component";
import { CategoryComponent } from "./category/category.component";
import { AssistantComponent } from "./assistant/assistant.component";
import { ClientComponent } from "./client/client.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { ReservationComponent } from "./reservation/reservation.component";
import { ReservationWizardComponent } from "./reservation-wizard/reservation-wizard.component";
import { UserComponent } from "./user/user.component";

/**
 * El asistente de reserva no tiene entrada en el menú: se llega desde "Nueva reserva".
 * Los roles de cada ruta son las mismas listas que los destinos del layout (FEAT-003).
 */
export const pagesRoutes: Routes = [
    { path: 'dashboard', component: DashboardComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'book', component: BookComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'category', component: CategoryComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'client', component: ClientComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'reservation', component: ReservationComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'reservation-wizard', component: ReservationWizardComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'assistant', component: AssistantComponent, canActivate: [rolGuard(PERSONAL)] },
    { path: 'user', component: UserComponent, canActivate: [rolGuard(SOLO_ADMIN)] },

    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
]
