import { Component, input} from '@angular/core';
import { Festival } from '../../interfaces/festival';

@Component({
  selector: 'app-festival-card-component',
  imports: [],
  templateUrl: './festival-card-component.html',
  styleUrl: './festival-card-component.css'
})
export class FestivalCardComponent {
  public festival = input<Festival>();
  
}
