import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FestivalFormComponent } from "./components/festival-form-component/festival-form-component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FestivalFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
