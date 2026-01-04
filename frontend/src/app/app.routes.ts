import { Routes } from '@angular/router';
import { WelcomePage } from './components/welcome-page/welcome-page';
import { authGuardInterceptor } from './shared/auth/auth-guard-interceptor';
import { Login } from './shared/auth/login/login';
import { ForbiddenPage } from './components/forbidden-page/forbidden-page';
import { FestivalList } from './components/festival-list/festival-list';

export const routes: Routes = [
    { path: 'home', component: WelcomePage, canActivate:[authGuardInterceptor] },
    { path: 'login', component: Login },
    { path: 'festival_list', component:FestivalList, canActivate: [authGuardInterceptor] },
    { path: 'forbidden', component: ForbiddenPage },
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: '**', redirectTo: 'home' },
];
