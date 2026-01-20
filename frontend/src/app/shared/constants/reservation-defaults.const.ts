export type ReservationStatus =
    | 'Pas encore de contact'
    | 'Contact pris'
    | 'Discussion en cours'
    | 'Sera absent'
    | 'Considéré absent'
    | 'Présent'
    | 'Facturé'
    | 'Facture payée';

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
    'Pas encore de contact',
    'Contact pris',
    'Discussion en cours',
    'Sera absent',
    'Considéré absent',
    'Présent',
    'Facturé',
    'Facture payée'
];

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
    'Pas encore de contact': '#9E9E9E', // Grey
    'Contact pris': '#2196F3', // Blue
    'Discussion en cours': '#FFC107', // Amber
    'Sera absent': '#F44336', // Red
    'Considéré absent': '#D32F2F', // Dark Red
    'Présent': '#4CAF50', // Green
    'Facturé': '#9C27B0', // Purple
    'Facture payée': '#009688' // Teal
};
