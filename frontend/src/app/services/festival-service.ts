import { Injectable, signal } from '@angular/core';
import { Festival } from '../interfaces/festival';
import { ReservationService } from './reservation-service';
//Injectable: Permet d'injecter ce service dans d'autres composants ou services
@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  festivalList = signal<Festival[]>([
    {
      name: "Festival-Rose",
      nbTables: 50,
      tariffZones: [
        { id: 1, name: "Zone A", nbTables: 20, tablePrice: 100, festivalName: "Festival-Rose", squareMeterPrice: 50 },
        { id: 2, name: "Zone B", nbTables: 30, tablePrice: 150, festivalName: "Festival-Rose", squareMeterPrice: 75 }
      ]
    },
    {
      name: "Festival-Batman",
      nbTables: 100,
      tariffZones: [
        { id: 3, name: "Zone C", nbTables: 50, tablePrice: 200, festivalName: "Festival-Batman", squareMeterPrice: 100 },
        { id: 4, name: "Zone D", nbTables: 50, tablePrice: 250, festivalName: "Festival-Batman", squareMeterPrice: 125 }
      ]
    },
    {
      name: "Festival-Nouveau",
      nbTables: 70,
      tariffZones: [
        { id: 5, name: "Zone E", nbTables: 35, tablePrice: 300, festivalName: "Festival-Nouveau", squareMeterPrice: 150 },
        { id: 6, name: "Zone F", nbTables: 35, tablePrice: 350, festivalName: "Festival-Nouveau", squareMeterPrice: 175 }
      ]
    }
  ]);

  //Cherche un festival par son nom
  findByName(name: string): Festival | undefined {
    return this.festivalList().find(f => f.name === name);
  }

  //Supprime un festival par son nom
  removeFestival(name: string) {
    this.festivalList.update(festivals => festivals.filter(f => f.name !== name));
  }

  //Ajoute un nouveau festival
  addFestival(festival: Festival) {
    this.festivalList.update(festivals => [...festivals, festival]);
  }

  //Met à jour un festival existant
  updateFestival(name: string, updatedFestival: Festival) {
    this.festivalList.update(festivals => 
      festivals.map(f => f.name === name ? updatedFestival : f)
    );
  }

  // Calculer le nombre de tables réservées pour un festival
  getTablesReservees(festivalName: string, reservationService: ReservationService): number {
    const reservations = reservationService.reservationList()
      .filter(r => r.festivalName === festivalName);
    
    return reservations.reduce((total, r) => {
      return total + r.zoneReservations.reduce((sum, zr) => sum + zr.nbTables, 0);
    }, 0);
  }

  // Calculer tables réservées par zone
  getTablesReserveesParZone(festivalName: string, zoneName: string, reservationService: ReservationService): number {
    const reservations = reservationService.reservationList()
      .filter(r => r.festivalName === festivalName);
    
    return reservations.reduce((total, r) => {
      const zoneRes = r.zoneReservations.find(zr => zr.zoneName === zoneName);
      return total + (zoneRes?.nbTables || 0);
    }, 0);
  }

}