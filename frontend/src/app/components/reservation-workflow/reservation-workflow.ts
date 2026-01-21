import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation-service';
import { EditorService } from '../../services/editor-service';
import { ReservationDAO } from '../../interfaces/reservationDAO';
import { SuiviReservation } from '../../interfaces/suivi-reservation';
import { SuiviHistoryComponent } from '../suivi-history/suivi-history';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { TariffZone } from '../../interfaces/tariff-zone';
import { ReservationGame } from '../../interfaces/reservation-game';
import { GameService } from '../../services/game-service';
import { ReservationGameSelector } from '../reservation-game-selector/reservation-game-selector';
import { ReservationStatusService } from '../../services/reservation-status-service';
import { Game } from '../../interfaces/game';

@Component({
  selector: 'app-reservation-workflow',
  standalone: true,
  imports: [FormsModule, SuiviHistoryComponent, ReservationGameSelector, CommonModule],
  templateUrl: './reservation-workflow.html',
  styleUrl: './reservation-workflow.css',
})
export class ReservationWorkflow {
  Math = Math; // Expose Math for template
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly reservationSvc = inject(ReservationService);
  readonly editorSvc = inject(EditorService);
  readonly tariffZoneSvc = inject(TariffZoneService);
  readonly gameSvc = inject(GameService);
  readonly reservationStatusSvc = inject(ReservationStatusService);

  reservationId = signal<number | null>(null);
  reservation = signal<ReservationDAO | null>(null);
  originalReservation = signal<ReservationDAO | null>(null);
  suiviHistory = signal<SuiviReservation[]>([]);
  reservationGames = signal<ReservationGame[]>([]);
  availableZones = signal<TariffZone[]>([]);
  loading = signal(true);
  savingLogistics = signal(false);
  errorMessage = signal<string | null>(null);
  showGameSelector = signal(false);

  availableStatuses = this.reservationStatusSvc.getAvailableStatuses();

  editor = computed(() => {
    const res = this.reservation();
    if (!res) return null;
    return this.editorSvc.editors().find(e => e.id === res.idEditor) || null;
  });

  selectedZone = computed(() => {
    const res = this.reservation();
    const zones = this.availableZones();
    if (!res || !res.idTZ || zones.length === 0) return null;
    const found = zones.find(z => Number(z.idTZ) === Number(res.idTZ)) || null;
    return found;
  });

  totalPrice = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    if (!res || !zone) return 0;

    return this.reservationSvc.calculateTotalPrice(res, zone);
  });

  remainingSmallRealTime = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res || !orig) return 0;

    // Calculate small tables used by m² (4m² = 1 small table, rounded up)
    const m2Tables = Math.ceil((res.m2 || 0) / 4);
    const origM2Tables = Math.ceil((orig.m2 || 0) / 4);

    if (res.idTZ === orig.idTZ) {
      const delta = (res.nbSmallTables + m2Tables) - (orig.nbSmallTables + origM2Tables);
      return Math.max(0, zone.remainingSmallTables - delta);
    } else {
      // Zone changed: the selected zone's remaining count doesn't know about this reservation yet
      return Math.max(0, zone.remainingSmallTables - res.nbSmallTables - m2Tables);
    }
  });

  remainingLargeRealTime = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res || !orig) return 0;

    if (res.idTZ === orig.idTZ) {
      const delta = res.nbLargeTables - orig.nbLargeTables;
      return Math.max(0, zone.remainingLargeTables - delta);
    } else {
      return Math.max(0, zone.remainingLargeTables - res.nbLargeTables);
    }
  });

  remainingCityHallRealTime = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res || !orig) return 0;

    if (res.idTZ === orig.idTZ) {
      const delta = res.nbCityHallTables - orig.nbCityHallTables;
      return Math.max(0, zone.remainingCityHallTables - delta);
    } else {
      return Math.max(0, zone.remainingCityHallTables - res.nbCityHallTables);
    }
  });

  // Max m² available = (remaining small tables + tables from current m²) * 4
  maxM2Available = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res) return 4;

    // Get base remaining (without m² effect)
    let baseRemaining = zone.remainingSmallTables;
    if (orig && res.idTZ === orig.idTZ) {
      // Add back the tables we originally used (both from nbSmallTables and m²)
      baseRemaining += orig.nbSmallTables + Math.ceil((orig.m2 || 0) / 4);
    }
    // Subtract currently selected small tables
    baseRemaining -= res.nbSmallTables;
    
    return Math.max(4, baseRemaining * 4);
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.reservationId.set(id);
      this.loadReservation(id);
      this.loadSuiviHistory(id);
      this.loadReservationGames(id);
    } else {
      this.loading.set(false);
    }
  }

  loadReservation(id: number) {
    this.reservationSvc.getReservationById(id).subscribe({
      next: (data) => {
        this.reservation.set(data);
        this.originalReservation.set(JSON.parse(JSON.stringify(data))); // Deep copy
        if (data.festivalName) {
          this.loadTariffZones(data.festivalName);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Erreur chargement réservation:', err);
        this.errorMessage.set("Erreur lors du chargement de la réservation.");
        this.loading.set(false);
      }
    });
  }

  loadTariffZones(festivalName: string) {
    this.tariffZoneSvc.findByFestivalName(festivalName).subscribe({
      next: (zones) => {
        console.log('[DEBUG] Zones loaded:', zones);
        console.log('[DEBUG] First zone smallTablePrice:', zones[0]?.smallTablePrice);
        this.availableZones.set(zones);
        this.loading.set(false); // Only stop loading after zones are here
      },
      error: (err: any) => {
        console.error('Erreur chargement zones:', err);
        this.loading.set(false);
      }
    });
  }

  loadSuiviHistory(id: number) {
    this.reservationSvc.getSuiviHistory(id).subscribe({
      next: (data) => this.suiviHistory.set(data),
      error: (err) => console.error('Erreur chargement suivi:', err)
    });
  }

  loadReservationGames(id: number) {
    this.reservationSvc.getReservationGames(id).subscribe({
      next: (data) => this.reservationGames.set(data),
      error: (err) => console.error('Erreur chargement jeux résa:', err)
    });
  }

  onStatusChange(newStatus: string) {
    const resId = this.reservationId();
    if (!resId) return;

    this.reservationSvc.updateStatus(resId, newStatus).subscribe({
      next: () => {
        this.reservation.update(r => r ? { ...r, status: newStatus } : null);
      },
      error: (err) => console.error('Erreur update status:', err)
    });
  }

  onSuiviAdded() {
    const id = this.reservationId();
    if (id) this.loadSuiviHistory(id);
  }

  onLogisticsUpdate() {
    const res = this.reservation();
    if (!res) return;

    this.savingLogistics.set(true);
    this.errorMessage.set(null);

    this.reservationSvc.updateReservation(res.idReservation, res as any).subscribe({
      next: () => {
        this.savingLogistics.set(false);
        this.originalReservation.set(JSON.parse(JSON.stringify(res))); // Update referentiel after save
        if (res.festivalName) {
          this.loadTariffZones(res.festivalName);
        }
        alert("Logistique mise à jour avec succès !");
      },
      error: (err) => {
        console.error('Erreur update logistique:', err);
        this.errorMessage.set(err.error?.error || "Erreur lors de la mise à jour.");
        this.savingLogistics.set(false);
      }
    });
  }

  updateField(field: keyof ReservationDAO, value: any) {
    // Clamp m² between 4 and max
    if (field === 'm2') {
      const max = this.maxM2Available();
      value = Math.max(4, Math.min(value, max));
    }
    this.reservation.update(r => r ? { ...r, [field]: value } : null);
  }

  onZoneChange(newIdTZ: number) {
    this.reservation.update(r => {
      if (!r) return null;
      // Reset tables if zone actually changes
      if (Number(r.idTZ) !== Number(newIdTZ)) {
        return {
          ...r,
          idTZ: newIdTZ,
          nbSmallTables: 0,
          nbLargeTables: 0,
          nbCityHallTables: 0
        };
      }
      return { ...r, idTZ: newIdTZ };
    });
  }

  addGameToReservation(event: { game: Game; quantity: number }) {
    const resId = this.reservationId();
    if (!resId) return;

    this.reservationSvc.addGameToReservation(resId, event.game.id, event.quantity).subscribe({
      next: () => {
        this.loadReservationGames(resId);
        this.showGameSelector.set(false);
      },
      error: (err) => alert(err.error?.error || "Erreur lors de l'ajout du jeu.")
    });
  }

  updateGameQuantity(gameId: number, quantity: number) {
    const resId = this.reservationId();
    if (!resId) return;

    this.reservationSvc.updateGameInReservation(resId, gameId, { quantity }).subscribe({
      next: () => this.loadReservationGames(resId),
      error: (err) => console.error('Erreur update quantité:', err)
    });
  }

  removeGame(gameId: number) {
    if (!confirm("Retirer ce jeu de la réservation ?")) return;

    const resId = this.reservationId();
    if (!resId) return;

    this.reservationSvc.removeGameFromReservation(resId, gameId).subscribe({
      next: () => this.loadReservationGames(resId),
      error: (err) => console.error('Erreur suppression jeu:', err)
    });
  }

  toggleGamePlaced(game: ReservationGame) {
    const resId = this.reservationId();
    if (!resId) return;

    this.reservationSvc.updateGameInReservation(resId, game.id, { isGamePlaced: !game.isGamePlaced }).subscribe({
      next: () => this.loadReservationGames(resId),
      error: (err) => console.error('Erreur update placement:', err)
    });
  }

  goBack() {
    this.router.navigate(['/reservations']);
  }

  generateInvoice() {
    if (!confirm("Générer la facture pour cet éditeur ? Cela passera le statut à 'Facturé'.")) return;
    this.onStatusChange('Facturé');
  }

  markPaid() {
    if (!confirm("Confirmer le paiement de la facture ? Cela passera le statut à 'Facture payée'.")) return;
    this.onStatusChange('Facture payée');
  }
}
