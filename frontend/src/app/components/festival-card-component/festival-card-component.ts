import { Component, input, output, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Festival } from '../../interfaces/festival';
import { FestivalService } from '../../services/festival-service';
import { ReservationService } from '../../services/reservation-service';

@Component({
  selector: 'app-festival-card-component',
  imports: [],
  templateUrl: './festival-card-component.html',
  styleUrl: './festival-card-component.css'
})
export class FestivalCardComponent {
  private router = inject(Router);
  private festivalService = inject(FestivalService);
  private reservationService = inject(ReservationService);

  public festival = input<Festival>();

  //Permet d'ajouter un bouton pour updater les infos d'un festival.
  editFestival = output<Festival>();
  // Output pour supprimer
  deleteFestival = output<string>();

  // Tables restantes
  tablesRestantes = computed(() => {
    const fest = this.festival();
    if (!fest) return 0;

    const tablesReservees = this.festivalService.getTablesReservees(
      fest.name,
      this.reservationService
    );

    return fest.nbTables - tablesReservees;
  });

  onEdit() {
    const fest = this.festival();
    if (fest) {
      this.editFestival.emit(fest);
    }
  }

  onDelete() {
    const fest = this.festival();
    if (fest) {
      // Afficher une confirmation avant suppression
      const confirmDelete = confirm(
        `Êtes-vous sûr de vouloir supprimer le festival "${fest.name}" ?\n\nCette action est irréversible.`
      );

      if (confirmDelete) {
        this.deleteFestival.emit(fest.name);
      }
    }
  }

  onViewDetails() {
    const fest = this.festival();
    if (fest) {
      this.router.navigate(['/festival', fest.name]);
    }
  }
}
