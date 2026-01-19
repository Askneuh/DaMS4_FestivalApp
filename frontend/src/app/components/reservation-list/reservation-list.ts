import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReservationService } from '../../services/reservation-service';
import { EditorService } from '../../services/editor-service';
import { FestivalService } from '../../services/festival-service';
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
  readonly router = inject(Router);

  currentFestival = this.festivalSvc.currentFestival;
  editorsData = signal<EditorWithReservationStatus[]>([]);
  loading = signal(true);

  searchTerm = signal('');
  statusFilter = signal<string>('all');
  sortColumn = signal<string>('name');
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
    const editors = this.editorsData().filter(e => e.exposant);
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const col = this.sortColumn();
    const dir = this.sortDirection();
    
    let result = editors
      .map(editor => ({
        editor: { id: editor.id, name: editor.name, logo: editor.logo, exposant: editor.exposant, distributeur: editor.distributeur },
        reservation: editor.reservation,
        status: editor.reservation?.status || 'Pas encore de contact',
        lastContact: editor.reservation?.lastContactDate 
          ? this.formatDate(editor.reservation.lastContactDate) 
          : null,
        totalPrice: editor.reservation?.totalPrice || 0,
        totalTables: editor.reservation 
          ? (editor.reservation.nbSmallTables || 0) + 
            (editor.reservation.nbLargeTables || 0) + 
            (editor.reservation.nbCityHallTables || 0) 
          : 0
      }))
      .filter(item => {
        const matchesSearch = item.editor.name.toLowerCase().startsWith(search);
        const matchesStatus = status === 'all' || item.status === status;
        return matchesSearch && matchesStatus;
      });

    result.sort((a, b) => {
      let valA: any, valB: any;
      
      switch(col) {
        case 'name': valA = a.editor.name; valB = b.editor.name; break;
        case 'status': valA = a.status; valB = b.status; break;
        case 'price': valA = a.totalPrice; valB = b.totalPrice; break;
        case 'tables': valA = a.totalTables; valB = b.totalTables; break;
        default: valA = a.editor.name; valB = b.editor.name;
      }

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  constructor() {
    if (this.currentFestival()) {
      this.loadData();
    } else {
      this.loading.set(false);
    }
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

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

    const newReservation = {
      idEditor: editorId,
      status: 'Contact pris',
      nbSmallTables: 0,
      nbLargeTables: 0,
      nbCityHallTables: 0,
      remise: 0,
      typeAnimateur: 0,
      listeDemandee: false,
      listeRecue: false,
      jeuxRecus: false,
      festivalName: festival.name,
      idTZ: 1
    };

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

  toggleSort(column: string) {
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
