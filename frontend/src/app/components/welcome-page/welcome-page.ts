import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../shared/auth/auth-services';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FestivalService } from '../../services/festival-service';
import { FestivalCardComponent } from '../festival-card-component/festival-card-component';


@Component({
  selector: 'app-welcome-page',
  imports: [FestivalCardComponent, RouterLink],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  router = inject(Router)
  readonly auth_svc = inject(AuthService)
  readonly currentUser = this.auth_svc.currentUser

  private festivalService = inject(FestivalService)
  readonly currentFestival = this.festivalService.currentFestival

  constructor() {
    effect(() => {
      if (this.auth_svc.isLoggedIn()) {
        this.festivalService.loadCurrentFestival();
      }
    });
  }

  logout() {
    this.auth_svc.logout();
  }
}
