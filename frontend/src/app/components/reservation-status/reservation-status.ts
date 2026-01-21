import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationStatusService } from '../../services/reservation-status-service';

@Component({
  selector: 'app-reservation-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-status.html',
  styleUrl: './reservation-status.css',
})
export class ReservationStatus {
  private readonly reservationStatusSvc = inject(ReservationStatusService);

  readonly currentStatus = input.required<string>();
  readonly statusChange = output<string>();

  availableStatuses = this.reservationStatusSvc.getAvailableStatuses();

  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.statusChange.emit(select.value);
  }
}
