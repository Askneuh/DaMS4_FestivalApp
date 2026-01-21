import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation-service';
import { DateFormatterService } from '../../services/date-formatter.service';
import { SuiviReservation } from '../../interfaces/suivi-reservation';

@Component({
  selector: 'app-suivi-history',
  imports: [FormsModule],
  templateUrl: './suivi-history.html',
  styleUrl: './suivi-history.css',
})
export class SuiviHistoryComponent {
  readonly reservationSvc = inject(ReservationService);
  readonly dateFormatter = inject(DateFormatterService);

  reservationId = input.required<number>();
  currentStatus = input.required<string>();
  history = input<SuiviReservation[]>([]);

  suiviAdded = output<void>();

  showForm = signal(false);
  newComment = signal('');
  submitting = signal(false);

  toggleForm() {
    this.showForm.update(v => !v);
    this.newComment.set('');
  }

  addSuivi() {
    const resId = this.reservationId();
    const status = this.currentStatus();
    const comment = this.newComment();

    if (!resId) return;

    this.submitting.set(true);
    this.reservationSvc.addSuivi(resId, status, comment).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.newComment.set('');
        this.suiviAdded.emit();
      },
      error: (err) => {
        console.error('Erreur ajout suivi:', err);
        this.submitting.set(false);
      }
    });
  }


}
