import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationDAO } from '../../interfaces/reservationDAO';
import { TariffZone } from '../../interfaces/tariff-zone';
import { ReservationService } from '../../services/reservation-service';

@Component({
  selector: 'app-reservation-logistic-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-logistic-form.html',
  styleUrl: './reservation-logistic-form.css',
})
export class ReservationLogisticForm {
  Math = Math;
  Number = Number;
  private readonly reservationSvc = inject(ReservationService);

  readonly reservation = input.required<ReservationDAO>();
  readonly originalReservation = input.required<ReservationDAO | null>();
  readonly availableZones = input.required<TariffZone[]>();
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly update = output<ReservationDAO>();
  readonly saveRequested = output<void>();

  selectedZone = computed(() => {
    const res = this.reservation();
    const zones = this.availableZones();
    if (!res || !res.idTZ || zones.length === 0) return null;
    return zones.find(z => Number(z.idTZ) === Number(res.idTZ)) || null;
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
    if (!zone || !res) return zone?.remainingSmallTables ?? 0;

    const m2Tables = Math.ceil((res.m2 || 0) / 4);

    // Si pas d'original ou zone originale différente/nulle, on calcule depuis les tables restantes de la zone
    if (!orig || !orig.idTZ || res.idTZ !== orig.idTZ) {
      return Math.max(0, zone.remainingSmallTables - res.nbSmallTables - m2Tables);
    }

    // Même zone : on ajoute les tables de l'original qui sont "rendues"
    const origM2Tables = Math.ceil((orig.m2 || 0) / 4);
    const delta = (res.nbSmallTables + m2Tables) - (orig.nbSmallTables + origM2Tables);
    return Math.max(0, zone.remainingSmallTables - delta);
  });

  remainingLargeRealTime = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res) return zone?.remainingLargeTables ?? 0;

    // Si pas d'original ou zone originale différente/nulle
    if (!orig || !orig.idTZ || res.idTZ !== orig.idTZ) {
      return Math.max(0, zone.remainingLargeTables - res.nbLargeTables);
    }

    const delta = res.nbLargeTables - orig.nbLargeTables;
    return Math.max(0, zone.remainingLargeTables - delta);
  });

  remainingCityHallRealTime = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res) return zone?.remainingCityHallTables ?? 0;

    // Si pas d'original ou zone originale différente/nulle
    if (!orig || !orig.idTZ || res.idTZ !== orig.idTZ) {
      return Math.max(0, zone.remainingCityHallTables - res.nbCityHallTables);
    }

    const delta = res.nbCityHallTables - orig.nbCityHallTables;
    return Math.max(0, zone.remainingCityHallTables - delta);
  });

  maxM2Available = computed(() => {
    const zone = this.selectedZone();
    const res = this.reservation();
    const orig = this.originalReservation();
    if (!zone || !res) return 4;

    let baseRemaining = zone.remainingSmallTables;
    if (orig && res.idTZ === orig.idTZ) {
      baseRemaining += orig.nbSmallTables + Math.ceil((orig.m2 || 0) / 4);
    }
    baseRemaining -= res.nbSmallTables;
    return Math.max(4, baseRemaining * 4);
  });

  onZoneChange(idTZ: number) {
    const current = this.reservation();
    if (Number(current.idTZ) === idTZ) return;

    this.update.emit({
      ...current,
      idTZ,
      nbSmallTables: 0,
      nbLargeTables: 0,
      nbCityHallTables: 0
    });
  }

  updateField(field: keyof ReservationDAO, value: any) {
    const current = this.reservation();
    if (field === 'm2') {
      const max = this.maxM2Available();
      value = Math.max(4, Math.min(value, max));
    }
    this.update.emit({ ...current, [field]: value });
  }

  onSubmit() {
    this.saveRequested.emit();
  }
}
