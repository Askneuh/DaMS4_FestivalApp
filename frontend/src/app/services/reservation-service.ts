import { Injectable, signal } from '@angular/core';
import { Reservation } from '../interfaces/reservation';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  // Liste de toutes les réservations
  reservationList = signal<Reservation[]>([]);

  // Ajouter une réservation
  addReservation(reservation: Reservation) {
    this.reservationList.update(reservations => [...reservations, reservation]);
  }

  // Trouver les réservations d'un festival
  findByFestival(festivalName: string): Reservation[] {
    return this.reservationList().filter(r => r.festivalName === festivalName);
  }

  // Mettre à jour une réservation
  updateReservation(id: number, updatedReservation: Reservation) {
    this.reservationList.update(reservations =>
      reservations.map(r => r.id === id ? updatedReservation : r)
    );
  }

  // Supprimer une réservation
  removeReservation(id: number) {
    this.reservationList.update(reservations =>
      reservations.filter(r => r.id !== id)
    );
  }

  // Calculer le prix total d'une réservation
  calculerTotal(zoneReservations: { zoneName: string; nbTables: number; prixUnitaire: number }[]): number {
    return zoneReservations.reduce((total, zone) => {
      return total + (zone.nbTables * zone.prixUnitaire);
    }, 0);
  }
}