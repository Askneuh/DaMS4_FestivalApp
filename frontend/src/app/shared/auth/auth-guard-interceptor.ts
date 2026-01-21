import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth-services';
export const authGuardInterceptor: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const auth_svc = inject(AuthService)
  if (auth_svc.isLoggedIn()) {
    return true;
  }
  else {
    return router.createUrlTree(['/login']) // no navigate inside navigation
  }
};