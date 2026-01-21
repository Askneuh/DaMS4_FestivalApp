import { Routes } from '@angular/router';
import { WelcomePage } from './components/welcome-page/welcome-page';
import { authGuardInterceptor } from './shared/auth/auth-guard-interceptor';
import { Login } from './shared/auth/login/login';
import { ForbiddenPage } from './components/forbidden-page/forbidden-page';
import { FestivalList } from './components/festival-list/festival-list';
import { Admin } from './components/admin/admin';
import { adminGuard } from './shared/admin/admin-guard';
import { EditorList } from './components/editor-list/editor-list';
import { EditorGamesComponent } from './components/editor-games/editor-games';
import { EditorContactsComponent } from './components/editor-contacts/editor-contacts';
import { PlanManagement } from './components/plan-management/plan-management';
import { ReservationList } from './components/reservation-list/reservation-list';
import { ReservationWorkflow } from './components/reservation-workflow/reservation-workflow';
import { FestivalGamesComponent } from './components/festival-games/festival-games';

export const routes: Routes = [
    { path: 'editor-list', component: EditorList, canActivate: [authGuardInterceptor] },
    { path: 'festival-games', component: FestivalGamesComponent, canActivate: [authGuardInterceptor] },
    { path: 'editor-games/:id', component: EditorGamesComponent, canActivate: [authGuardInterceptor] },
    { path: 'editor-contacts/:id', component: EditorContactsComponent, canActivate: [authGuardInterceptor] },
    { path: 'home', component: WelcomePage, canActivate: [authGuardInterceptor] },
    { path: 'login', component: Login },
    { path: 'festival_list', component: FestivalList, canActivate: [authGuardInterceptor] },
    { path: 'plan-management', component: PlanManagement },
    { path: 'reservations', component: ReservationList, canActivate: [authGuardInterceptor] },
    { path: 'reservation-workflow/:id', component: ReservationWorkflow, canActivate: [authGuardInterceptor] },
    { path: 'admin', component: Admin, canActivate: [authGuardInterceptor, adminGuard] },
    { path: 'forbidden', component: ForbiddenPage },
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: '**', redirectTo: 'home' },
];
