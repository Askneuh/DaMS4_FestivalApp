import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReservationService } from '../../services/reservation-service';
import { EditorService } from '../../services/editor-service';
import { FestivalService } from '../../services/festival-service';
import { ReservationDAO } from '../../interfaces/reservationDAO';

@Component({
  selector: 'app-reservation-list',
  imports: [],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationList {
  private reservationService = inject(ReservationService);
  private editorService = inject(EditorService);
  private festivalService = inject(FestivalService);
  private router = inject(Router);

  currentFestival = this.festivalService.currentFestival;
  allEditors = this.editorService.editors;
  reservations = signal<ReservationDAO[]>([]);
  loading = signal(true);

  // Filtrer uniquement les exposants (peuvent réserver)
  exposantEditors = computed(() => {
    return this.allEditors().filter(e => e.exposant === true);
  });

  // Associer chaque exposant avec sa réservation (si elle existe)
  editorsWithReservations = computed(() => {
    const editors = this.exposantEditors();
    const reservations = this.reservations();
    
    return editors.map(editor => {
      const reservation = reservations.find(r => r.idEditor === editor.id);
      return {
        editor,
        reservation: reservation || null,
        status: reservation?.status || 'Pas encore de contact',
        lastContact: null, // TODO: récupérer depuis suiviReservation
        totalPrice: reservation ? this.calculatePrice(reservation) : 0,
        totalTables: reservation ? 
          (reservation.nbSmallTables || 0) + 
          (reservation.nbLargeTables || 0) +  
          (reservation.nbCityHallTables || 0) : 0
      };
    });
  });

  constructor() {
    const festival = this.currentFestival();
    if (festival) {
      this.loadReservations(festival.name);
    } else {
      this.loading.set(false);
    }
  }

  loadReservations(festivalName: string) {
    this.reservationService.getReservationsByFestival(festivalName).subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement réservations:', err);
        this.loading.set(false);
      }
    });
  }

  calculatePrice(reservation: ReservationDAO): number {
    // TODO: récupérer les prix depuis tariffZone
    // Pour l'instant, prix fictif
    const smallPrice = 80;
    const largePrice = 120;
    const cityHallPrice = 150;
    
    const total = 
      (reservation.nbSmallTables || 0) * smallPrice +
      (reservation.nbLargeTables || 0) * largePrice +
      (reservation.nbCityHallTables || 0) * cityHallPrice -
      (reservation.remise || 0);
    
    return Math.max(0, total);
  }

  openWorkflow(editorId: number, reservationId?: number) {
    if (reservationId) {
      this.router.navigate(['/reservation-workflow', reservationId]);
    } else {
      // TODO: créer une réservation puis rediriger
      console.log('Création réservation pour éditeur', editorId);
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
