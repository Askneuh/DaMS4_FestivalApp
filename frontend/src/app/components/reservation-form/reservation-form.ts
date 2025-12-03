import { Component, inject, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation-service';
import { Reservation, ReservationStatus, ZoneReservation } from '../../interfaces/reservation';
import { Festival } from '../../interfaces/festival';
import { FestivalService } from '../../services/festival-service';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationForm {
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  private festivalService = inject(FestivalService);
  
  // Le festival pour lequel on réserve
  festival = input.required<Festival>();
  
  // Événement quand la réservation est créée
  reservationCreated = output<void>();
  
  showForm = signal(false);
  
  // Liste des statuts disponibles
  statusOptions: ReservationStatus[] = [
    'Pas encore de contact',
    'Contact pris',
    'Discussion en cours',
    'Sera absent',
    'Considéré absent',
    'Présent',
    'Facturé',
    'Facture payée'
  ];

  reservationForm: FormGroup = this.fb.group({
    editeur: ['', [Validators.required, Validators.minLength(2)]],
    status: ['Pas encore de contact', Validators.required],
    zoneReservations: this.fb.array([])
  });

  get zoneReservations(): FormArray {
    return this.reservationForm.get('zoneReservations') as FormArray;
  }

// Prix total comme signal
prixTotal = signal(0);

// Constructeur pour écouter les changements
constructor() {
  // Écoute les changements du formulaire
  this.reservationForm.valueChanges.subscribe(() => {
    this.updatePrixTotal();
  });
}

// Calculer le prix total
private updatePrixTotal() {
  let total = 0;
  this.zoneReservations.controls.forEach((control) => {
    const nbTables = control.get('nbTables')?.value || 0;
    const prixUnitaire = control.get('prixUnitaire')?.value || 0;
    total += nbTables * prixUnitaire;
  });
  this.prixTotal.set(total);
}

// Vérifier si assez de tables disponibles
hasEnoughTables(zoneName: string, nbTables: number): boolean {
  const zone = this.festival().tariffZones.find(z => z.name === zoneName);
  if (!zone) return false;
  
  const tablesReservees = this.festivalService.getTablesReserveesParZone(
    this.festival().name, 
    zoneName, 
    this.reservationService
  );
  
  return (tablesReservees + nbTables) <= zone.nbTables;
}

// Obtenir tables restantes pour une zone
getTablesRestantes(zoneName: string): number {
  const zone = this.festival().tariffZones.find(z => z.name === zoneName);
  if (!zone) return 0;
  
  // Tables déjà réservées dans d'autres réservations
  const tablesReservees = this.festivalService.getTablesReserveesParZone(
    this.festival().name, 
    zoneName, 
    this.reservationService
  );
  
  // Tables en cours de réservation dans CE formulaire
  const tablesEnCours = this.zoneReservations.controls.reduce((total, control) => {
    if (control.get('zoneName')?.value === zoneName) {
      return total + (control.get('nbTables')?.value || 0);
    }
    return total;
  }, 0);
  
  return zone.nbTables - tablesReservees - tablesEnCours;
}

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  addZoneReservation(zoneName: string, prixUnitaire: number) {
    const zoneForm = this.fb.group({
      zoneName: [zoneName],
      nbTables: [1, [Validators.required, Validators.min(1)]],
      prixUnitaire: [prixUnitaire]
    });
    this.zoneReservations.push(zoneForm);
    this.updatePrixTotal();
  }

  removeZoneReservation(index: number) {
    this.zoneReservations.removeAt(index);
    this.updatePrixTotal();
  }

  onSubmit() {
    if (this.reservationForm.valid) {
      const formValue = this.reservationForm.value;
      // Vérifier si assez de tables disponibles
    for (const zr of formValue.zoneReservations) {
      if (!this.hasEnoughTables(zr.zoneName, zr.nbTables)) {
        alert(`Pas assez de tables disponibles dans ${zr.zoneName} (${this.getTablesRestantes(zr.zoneName)} restantes)`);
        return;
      }
    }
      
      const zoneReservations: ZoneReservation[] = formValue.zoneReservations.map((zr: any) => ({
        ...zr,
        sousTotal: zr.nbTables * zr.prixUnitaire
      }));

      const reservation: Reservation = {
        id: Date.now(),
        festivalName: this.festival().name,
        editeur: formValue.editeur,
        zoneReservations,
        prixTotal: this.prixTotal(),
        status: formValue.status
      };

      this.reservationService.addReservation(reservation);
      this.resetForm();
      this.showForm.set(false);
      this.reservationCreated.emit();
    }
  }

  resetForm() {
    this.reservationForm.reset({ status: 'Pas encore de contact' });
    this.zoneReservations.clear();
  }
}