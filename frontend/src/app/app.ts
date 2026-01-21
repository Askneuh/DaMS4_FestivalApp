import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLink, RouterLinkActive } from '@angular/router';
import { FestivalList } from './components/festival-list/festival-list';
import { AuthService } from './shared/auth/auth-services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  readonly authSvc = inject(AuthService);

  ngOnInit() {
    this.authSvc.whoami();
  }

  logout() {
    this.authSvc.logout();
  }
}
