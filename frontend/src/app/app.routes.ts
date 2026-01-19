import { Routes } from '@angular/router';
import { WelcomePage } from './components/welcome-page/welcome-page';
import { authGuardInterceptor } from './shared/auth/auth-guard-interceptor';
import { Login } from './shared/auth/login/login';
import { ForbiddenPage } from './components/forbidden-page/forbidden-page';
import { FestivalList } from './components/festival-list/festival-list';
import { TestService } from './components/test-service/test-service';
import { Admin } from './components/admin/admin';
import { adminGuard } from './shared/admin/admin-guard';
import { EditorList } from './components/editor-list/editor-list';
import { EditorGamesComponent } from './components/editor-games/editor-games';
import { EditorContactsComponent } from './components/editor-contacts/editor-contacts';
import { ReservationList } from './components/reservation-list/reservation-list';

export const routes: Routes = [
    { path: 'editor-list', component: EditorList, canActivate: [authGuardInterceptor] },
    { path: 'editor-games/:id', component: EditorGamesComponent, canActivate: [authGuardInterceptor] },
    { path: 'editor-contacts/:id', component: EditorContactsComponent, canActivate: [authGuardInterceptor] },
    { path: 'home', component: WelcomePage, canActivate: [authGuardInterceptor] },
    { path: 'login', component: Login },
    { path: 'festival_list', component: FestivalList, canActivate: [authGuardInterceptor] },
    { path: 'reservations', component: ReservationList, canActivate: [authGuardInterceptor] },
    { path: 'test-service', component: TestService, canActivate: [authGuardInterceptor] },
    { path: 'admin', component: Admin, canActivate: [authGuardInterceptor, adminGuard] },
    { path: 'forbidden', component: ForbiddenPage },
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: '**', redirectTo: 'home' },
];
