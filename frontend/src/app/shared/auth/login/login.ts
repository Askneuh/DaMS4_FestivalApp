import { Component, inject, effect  } from '@angular/core';
import { MatFormField, MatFormFieldModule, MatLabel} from '@angular/material/form-field';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth-services';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly formulaire = new FormGroup({
    login: new FormControl<string>('empty login', Validators.required),
    password: new FormControl<string>('empty password', Validators.required)
  })
  readonly auth_svc = inject(AuthService);
  readonly router = inject(Router);
  private effect = effect(() => {
      const user = this.auth_svc.currentUser();
      if (user) {
          this.router.navigate(['']);
      }
    });
  

  login(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    if (this.formulaire.invalid) {
      console.log("Form invalide")
    }
    const login = this.formulaire.get(['login'])?.value
    const password = this.formulaire.get(['password'])?.value
    
    this.auth_svc.login(login, password)
    
  }
}