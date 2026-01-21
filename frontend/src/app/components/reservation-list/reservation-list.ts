import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReservationService } from '../../services/reservation-service';
import { EditorService } from '../../services/editor-service';
import { FestivalService } from '../../services/festival-service';
import { DateFormatterService } from '../../services/date-formatter-service';
import { EditorWithReservationStatus } from '../../interfaces/editor-with-reservation-status';

@Component({
  selector: 'app-reservation-list',
  imports: [],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationList {
  readonly reservationSvc = inject(ReservationService);
  readonly editorSvc = inject(EditorService);
  readonly festivalSvc = inject(FestivalService);
  readonly dateFormatter = inject(DateFormatterService);
  readonly router = inject(Router);

  currentFestival = this.festivalSvc.currentFestival;
  editorsData = signal<EditorWithReservationStatus[]>([]);
  loading = signal(true);

  searchTerm = signal('');
  statusFilter = signal<string>('all');
  sortColumn = signal<'name' | 'status' | 'price' | 'tables'>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  availableStatuses = [
    'all',
    'Pas encore de contact',
    'Contact pris',
    'Discussion en cours',
    'Sera absent',
    'Considéré absent',
    'Présent',
    'Facturé',
    'Facture payée'
  ];

  editorsWithReservations = computed(() => {
    return this.reservationSvc.filterAndSortReservations(
      this.editorsData(),
      this.searchTerm(),
      this.statusFilter(),
      this.sortColumn(),
      this.sortDirection()
    );
  });

  constructor() {
    effect(() => {
      const festival = this.currentFestival();
      if (festival) {
        this.loadData();
      } else {
        this.loading.set(false);
      }
    });
  }

  loadData() {
    this.editorSvc.getEditorsWithReservationStatusForCurrentFestival().subscribe({
      next: (data) => {
        this.editorsData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement données:', err);
        this.loading.set(false);
      }
    });
  }



  openWorkflow(editorId: number, reservationId: number) {
    this.router.navigate(['/reservation-workflow', reservationId]);
  }

  createReservation(editorId: number) {
    const festival = this.currentFestival();
    if (!festival) {
      alert('Veuillez sélectionner un festival courant.');
      return;
    }

    const newReservation = this.reservationSvc.createDefaultReservation(editorId, festival.name);

    this.reservationSvc.createReservation(newReservation).subscribe({
      next: (response) => {
        this.loadData();
        if (response.id) {
          this.router.navigate(['/reservation-workflow', response.id]);
        }
      },
      error: (err) => {
        console.error('Erreur création réservation:', err);
        alert('Erreur lors de la création de la réservation.');
      }
    });
  }

  toggleSort(column: 'name' | 'status' | 'price' | 'tables') {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  markContacted(item: any) {
    if (!item.reservation) {
      alert("Veuillez d'abord créer la réservation pour ajouter un suivi.");
      return;
    }

    const comment = prompt("Commentaire pour ce contact (optionnel) :");
    if (comment !== null) {
      this.reservationSvc.addSuivi(item.reservation.idReservation, item.status, comment).subscribe({
        next: () => {
          alert("Contact enregistré !");
          this.loadData();
        },
        error: (err) => console.error("Erreur addSuivi", err)
      });
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pas encore de contact': '#9E9E9E',
      'Contact pris': '#FFC107',
      'Discussion en cours': '#FF9800',
      'Sera absent': '#F44336',
      'Considéré absent': '#F44336',
      'Présent': '#4CAF50',
      'Facturé': '#2196F3',
      'Facture payée': '#388E3C'
    };
    return colors[status] || '#9E9E9E';
  }
}
