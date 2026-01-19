import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation-service';
import { SuiviReservation } from '../../interfaces/suivi-reservation';

@Component({
  selector: 'app-suivi-history',
  imports: [FormsModule],
  templateUrl: './suivi-history.html',
  styleUrl: './suivi-history.css',
})
export class SuiviHistoryComponent {
  readonly reservationSvc = inject(ReservationService);

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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
