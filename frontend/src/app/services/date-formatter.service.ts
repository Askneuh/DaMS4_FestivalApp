import { Injectable } from '@angular/core';

/**
 * Service pour le formatage des dates
 */
@Injectable({
    providedIn: 'root'
})
export class DateFormatterService {

    /**
     * Formate une date au format français (jj/mm/aaaa)
     * @param date - Date à formater
     * @returns Date formatée
     */
    formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Formate une date avec l'heure au format français (jj/mm/aaaa hh:mm)
     * @param date - Date à formater
     * @returns Date et heure formatées
     */
    formatDateTime(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formate une date au format ISO (aaaa-mm-jj)
     * @param date - Date à formater
     * @returns Date au format ISO
     */
    formatDateISO(date: Date | string): string {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }
}
