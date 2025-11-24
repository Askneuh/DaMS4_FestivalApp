import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FestivalList } from './components/festival-list/festival-list';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,FestivalList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
