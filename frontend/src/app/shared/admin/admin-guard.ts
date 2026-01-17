import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth-services';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const auth_svc = inject(AuthService)
  if (auth_svc.isLoggedIn() && auth_svc.currentUser()?.role === 'admin') {
    return true;
  }
  else { // indicate next navigation
    return router.createUrlTree(['/forbidden']) // no navigate inside navigation
  }
};
