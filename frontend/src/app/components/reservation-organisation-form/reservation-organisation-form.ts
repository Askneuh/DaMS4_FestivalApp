import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationDAO } from '../../interfaces/reservationDAO';

@Component({
  selector: 'app-reservation-organisation-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-organisation-form.html',
  styleUrl: './reservation-organisation-form.css',
})
export class ReservationOrganisationForm {
  readonly reservation = input.required<ReservationDAO>();
  readonly saving = input(false);

  readonly update = output<ReservationDAO>();
  readonly saveRequested = output<void>();

  updateField(field: keyof ReservationDAO, value: any) {
    this.update.emit({ ...this.reservation(), [field]: value });
  }

  onSubmit() {
    this.saveRequested.emit();
  }
}
