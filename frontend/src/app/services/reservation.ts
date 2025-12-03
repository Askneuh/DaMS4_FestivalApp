export interface Reservation {
  id: number;
  festivalName: string;
  editeur: string;
  zoneReservations: ZoneReservation[];
  prixTotal: number;
  status: ReservationStatus;
  datesContact?: Date[];
}

export interface ZoneReservation {
  zoneName: string;
  nbTables: number;
  prixUnitaire: number;
  sousTotal: number;
}

export type ReservationStatus = 
  | 'Pas encore de contact'
  | 'Contact pris'
  | 'Discussion en cours'
  | 'Sera absent'
  | 'Considéré absent'
  | 'Présent'
  | 'Facturé'
  | 'Facture payée';