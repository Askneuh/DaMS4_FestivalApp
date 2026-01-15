import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/auth/auth-services';
import { Router, RouterLink, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-welcome-page',
  imports: [],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  router = inject(Router)
  readonly auth_svc = inject(AuthService)
  readonly currentUser = this.auth_svc.currentUser

  logout() {
    this.auth_svc.logout();
  }
}
