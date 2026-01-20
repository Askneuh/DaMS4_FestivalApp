/**
 * Retourne la date actuelle au format YYYY-MM-DD ajustée au fuseau horaire local
 */
export function getCurrentDate(): string {
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60 * 1000
    const adjusted = new Date(now.getTime() - offsetMs)
    return adjusted.toISOString().substring(0, 10)
}
