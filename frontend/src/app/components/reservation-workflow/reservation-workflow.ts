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
import { ReservationStatusService } from '../../services/reservation-status.service';
import { Game } from '../../interfaces/game';

@Component({
  selector: 'app-reservation-workflow',
  standalone: true,
  imports: [FormsModule, SuiviHistoryComponent, ReservationGameSelector, CommonModule],
  templateUrl: './reservation-workflow.html',
  styleUrl: './reservation-workflow.css',
})
export class ReservationWorkflow {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly reservationSvc = inject(ReservationService);
  readonly editorSvc = inject(EditorService);
  readonly tariffZoneSvc = inject(TariffZoneService);
  readonly gameSvc = inject(GameService);
  readonly reservationStatusSvc = inject(ReservationStatusService);

  reservationId = signal<number | null>(null);
  reservation = signal<ReservationDAO | null>(null);
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
    if (!res || !res.idTZ) return null;
    return this.availableZones().find(z => z.idTZ === res.idTZ) || null;
  });

  totalPrice = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    if (!res || !zone) return 0;

    return this.reservationSvc.calculateTotalPrice(res, zone);
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
        if (data.festivalName) {
          this.loadTariffZones(data.festivalName);
        }
        this.loading.set(false);
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
      next: (zones) => this.availableZones.set(zones),
      error: (err) => console.error('Erreur chargement zones:', err)
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
    this.reservation.update(r => r ? { ...r, [field]: value } : null);
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
