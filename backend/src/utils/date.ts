/**
 * Retourne la date actuelle au format YYYY-MM-DD ajustée au fuseau horaire local
 */
export function getCurrentDate(): string {
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60 * 1000
    const adjusted = new Date(now.getTime() - offsetMs)
    return adjusted.toISOString().substring(0, 10)
}

/**
 * Retourne la date et l'heure actuelles au format ISO (YYYY-MM-DDTHH:mm:ss) ajustée au fuseau horaire local
 */
export function getCurrentDateTime(): string {
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60 * 1000
    const adjusted = new Date(now.getTime() - offsetMs)
    return adjusted.toISOString().substring(0, 19) // Format: YYYY-MM-DDTHH:mm:ss
}
