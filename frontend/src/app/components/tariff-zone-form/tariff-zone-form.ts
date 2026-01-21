import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tariff-zone-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './tariff-zone-form.html',
  styleUrl: './tariff-zone-form.css',
})
export class TariffZoneForm {
  zoneForm = input.required<FormGroup>();
  index = input.required<number>();
  remove = output<void>();

  onRemove() {
    this.remove.emit();
  }
}
