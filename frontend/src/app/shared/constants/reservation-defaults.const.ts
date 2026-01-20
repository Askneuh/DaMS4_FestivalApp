/**
 * Valeurs par défaut pour la création de réservations
 */
export const RESERVATION_DEFAULTS = {
    status: 'Contact pris',
    nbSmallTables: 0,
    nbLargeTables: 0,
    nbCityHallTables: 0,
    remise: 0,
    typeAnimateur: 0,
    listeDemandee: false,
    listeRecue: false,
    jeuxRecus: false,
    defaultTariffZoneId: 1
} as const;

/**
 * Statuts disponibles pour les réservations
 */
export const RESERVATION_STATUSES = [
    'Pas encore de contact',
    'Contact pris',
    'Discussion en cours',
    'Sera absent',
    'Considéré absent',
    'Présent',
    'Facturé',
    'Facture payée'
] as const;

/**
 * Type pour les statuts de réservation
 */
export type ReservationStatus = typeof RESERVATION_STATUSES[number];

/**
 * Couleurs associées aux statuts de réservation
 */
export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
    'Pas encore de contact': '#9E9E9E',
    'Contact pris': '#FFC107',
    'Discussion en cours': '#FF9800',
    'Sera absent': '#F44336',
    'Considéré absent': '#F44336',
    'Présent': '#4CAF50',
    'Facturé': '#2196F3',
    'Facture payée': '#388E3C'
};

