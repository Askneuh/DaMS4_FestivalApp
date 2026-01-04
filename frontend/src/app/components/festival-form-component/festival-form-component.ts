import { Component, inject } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Festival } from '../../interfaces/festival';
import { FestivalService } from '../../services/festival-service';



@Component({
  selector: 'app-festival-form-component',
  imports: [MatFormField, MatLabel, ReactiveFormsModule, MatInputModule],
  templateUrl: './festival-form-component.html',
  styleUrl: './festival-form-component.css',
})
export class FestivalFormComponent {
  readonly svc = inject(FestivalService)
  readonly form = new FormGroup({
    name: new FormControl<string>(''),
    nbTables: new FormControl<number>(0)
  })

  addFestival(event: Event): void {
    event.preventDefault
    if (this.form.invalid) {
      console.log("invalid form")
    }

    else {
      const name = this.form.get(['name'])?.value
      const nbTables = this.form.get(['nbTables'])?.value
      const festival: Festival = {
        name: name,
        nbTables: nbTables,
        tariffZones: []
      }
      this.svc.addFestivalBD(festival)
    }
  }
}
