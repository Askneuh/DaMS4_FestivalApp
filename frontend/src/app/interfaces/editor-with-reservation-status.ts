import { Contact } from "./contact";
import { Reservation } from "./reservation";

// Interface pour la réponse de la route withReservationStatus
export interface EditorWithReservationStatus {
    id: number;
    name: string;
    exposant: boolean;
    distributeur: boolean;
    logo: string;

    // Contact prioritaire
    contact: Contact | null;

    // Réservation pour le festival (null si pas de réservation)
    reservation: {
        idReservation: number;
        status: string;
        nbSmallTables: number;
        nbLargeTables: number;
        nbCityHallTables: number;
        m2: number;
        remise: number;
        totalPrice: number;
        totalTables: number;
        lastContactDate: Date | null;
    } | null;

    // Indicateurs dérivés
    hasReservation: boolean;
    hasBeenContacted: boolean;
}
