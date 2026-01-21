import { Injectable } from '@angular/core';
import { RESERVATION_STATUSES, RESERVATION_STATUS_COLORS, ReservationStatus } from '../shared/constants/reservation-defaults.const';

/**
 * Service pour gérer les statuts de réservation
 */
@Injectable({
    providedIn: 'root'
})
export class ReservationStatusService {

    /**
     * Retourne la couleur associée à un statut
     * @param status - Statut de la réservation
     * @returns Code couleur hexadécimal
     */
    getStatusColor(status: string): string {
        return RESERVATION_STATUS_COLORS[status as ReservationStatus] || '#9E9E9E';
    }

    /**
     * Retourne la liste de tous les statuts disponibles
     * @returns Tableau des statuts
     */
    getAvailableStatuses(): readonly ReservationStatus[] {
        return RESERVATION_STATUSES;
    }

    /**
     * Retourne le statut suivant dans le workflow
     * @param currentStatus - Statut actuel
     * @returns Statut suivant ou null si c'est le dernier
     */
    getNextStatus(currentStatus: string): ReservationStatus | null {
        const statuses = [...RESERVATION_STATUSES];
        const index = statuses.indexOf(currentStatus as ReservationStatus);
        return index >= 0 && index < statuses.length - 1
            ? statuses[index + 1]
            : null;
    }

    /**
     * Retourne le statut précédent dans le workflow
     * @param currentStatus - Statut actuel
     * @returns Statut précédent ou null si c'est le premier
     */
    getPreviousStatus(currentStatus: string): ReservationStatus | null {
        const statuses = [...RESERVATION_STATUSES];
        const index = statuses.indexOf(currentStatus as ReservationStatus);
        return index > 0 ? statuses[index - 1] : null;
    }

    /**
     * Vérifie si un statut est valide
     * @param status - Statut à vérifier
     * @returns true si le statut est valide
     */
    isValidStatus(status: string): status is ReservationStatus {
        return (RESERVATION_STATUSES as readonly string[]).includes(status);
    }
}

