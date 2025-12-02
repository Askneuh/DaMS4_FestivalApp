import { Component } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Festival } from '../../interfaces/festival';

@Component({
  selector: 'app-tariff-zone-form-component',
  imports: [MatFormField, MatLabel, ReactiveFormsModule, MatInputModule],
  templateUrl: './tariff-zone-form-component.html',
  styleUrl: './tariff-zone-form-component.css',
})
export class TariffZoneFormComponent {
  readonly form = new FormGroup({
    id: new FormControl<number>(0),
    name: new FormControl<string>(""),
    nbTables: new FormControl<number>(0),
    tablePrice: new FormControl<number>(0),
    festivalName: new FormControl<string>(""),
    squareMeterPrice: new FormControl<number>(0)
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
    }
  }
}
