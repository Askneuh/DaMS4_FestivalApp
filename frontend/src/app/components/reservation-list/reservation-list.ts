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
  readonly reservationService = inject(ReservationService);
  readonly editorService = inject(EditorService);
  readonly festivalService = inject(FestivalService);
  readonly router = inject(Router);

  currentFestival = this.festivalService.currentFestival;
  allEditors = this.editorService.editors;
  reservations = signal<ReservationDAO[]>([]);
  loading = signal(true);

  // Filtres et Tri
  searchTerm = signal('');
  statusFilter = signal<string>('all');
  sortColumn = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Liste des statuts pour le filtre
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

  // Filtrer uniquement les exposants (peuvent réserver)
  exposantEditors = computed(() => {
    return this.allEditors().filter(e => e.exposant === true);
  });

  // Associer chaque exposant avec sa réservation et appliquer filtres/tri
  editorsWithReservations = computed(() => {
    const editors = this.exposantEditors();
    const reservations = this.reservations();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const col = this.sortColumn();
    const dir = this.sortDirection();
    
    // 1. Association et premier filtrage (recherche + statut)
    let result = editors
      .map(editor => {
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
      })
      .filter(item => {
        const matchesSearch = item.editor.name.toLowerCase().startsWith(search);
        const matchesStatus = status === 'all' || item.status === status;
        return matchesSearch && matchesStatus;
      });

    // 2. Tri
    result.sort((a, b) => {
      let valA: any, valB: any;
      
      switch(col) {
        case 'name': 
          valA = a.editor.name; 
          valB = b.editor.name; 
          break;
        case 'status': 
          valA = a.status; 
          valB = b.status; 
          break;
        case 'price': 
          valA = a.totalPrice; 
          valB = b.totalPrice; 
          break;
        case 'tables': 
          valA = a.totalTables; 
          valB = b.totalTables; 
          break;
        default: 
          valA = a.editor.name; 
          valB = b.editor.name;
      }

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
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
      // TODO: créer une réservation puis rediriger vers workflow
      console.log('Création réservation pour éditeur', editorId);
    }
  }

  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  markContacted(item: any) {
    // Si pas de réservation, on ne peut pas encore ajouter de suivi (besoin d'idReservation)
    // Mais on pourrait imaginer créer la réservation automatiquement en "Discussion"
    if (!item.reservation) {
      alert("Veuillez d'abord créer la réservation pour ajouter un suivi.");
      return;
    }

    const comment = prompt("Commentaire pour ce contact (optionnel) :");
    if (comment !== null) {
      this.reservationService.addSuivi(item.reservation.idReservation, item.status, comment).subscribe({
        next: () => alert("Contact enregistré !"),
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
