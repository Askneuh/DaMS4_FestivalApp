import pool from '../db/database.js'

/**
 * Validation result interface
 */
interface ValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validates that the total number of tables across all tariff zones
 * for a festival does not exceed the festival's available table capacity.
 * 
 * @param festivalName - Name of the festival
 * @param nbSmallTables - Number of small tables for the zone being created/updated
 * @param nbLargeTables - Number of large tables for the zone being created/updated
 * @param nbCityHallTables - Number of city hall tables for the zone being created/updated
 * @param excludeTzId - Optional. For updates, the ID of the zone being updated (to exclude from totals)
 * @returns ValidationResult with valid flag and optional error message
 */
export async function validateTariffZoneTableLimits(
    festivalName: string,
    nbSmallTables: number,
    nbLargeTables: number,
    nbCityHallTables: number,
    excludeTzId?: number
): Promise<ValidationResult> {
    try {
        // Get festival table limits
        const festivalQuery = await pool.query(
            'SELECT "nbSmallTables", "nbLargeTables", "nbCityHallTables" FROM "festival" WHERE "name" = $1',
            [festivalName]
        )

        if (festivalQuery.rows.length === 0) {
            return {
                valid: false,
                error: `Festival "${festivalName}" non trouvé`
            }
        }

        const festival = festivalQuery.rows[0]
        const festivalLimits = {
            small: festival.nbSmallTables,
            large: festival.nbLargeTables,
            cityHall: festival.nbCityHallTables
        }

        // Get current totals from all tariff zones (excluding the one being updated if applicable)
        let totalTablesQuery
        if (excludeTzId) {
            totalTablesQuery = await pool.query(
                `SELECT 
                    COALESCE(SUM("nbSmallTables"), 0) as "totalSmall",
                    COALESCE(SUM("nbLargeTables"), 0) as "totalLarge",
                    COALESCE(SUM("nbCityHallTables"), 0) as "totalCity"
                 FROM "tariffZone" 
                 WHERE "festivalName" = $1 AND "idTZ" != $2`,
                [festivalName, excludeTzId]
            )
        } else {
            totalTablesQuery = await pool.query(
                `SELECT 
                    COALESCE(SUM("nbSmallTables"), 0) as "totalSmall",
                    COALESCE(SUM("nbLargeTables"), 0) as "totalLarge",
                    COALESCE(SUM("nbCityHallTables"), 0) as "totalCity"
                 FROM "tariffZone" 
                 WHERE "festivalName" = $1`,
                [festivalName]
            )
        }

        const currentTotals = totalTablesQuery.rows[0]

        // Calculate new totals with the zone being created/updated
        const newTotals = {
            small: parseInt(currentTotals.totalSmall) + (nbSmallTables || 0),
            large: parseInt(currentTotals.totalLarge) + (nbLargeTables || 0),
            cityHall: parseInt(currentTotals.totalCity) + (nbCityHallTables || 0)
        }

        // Check for violations
        const errors: string[] = []

        if (newTotals.small > festivalLimits.small) {
            errors.push(
                `Dépassement de petites tables : ${newTotals.small}/${festivalLimits.small} (vous essayez d'ajouter ${nbSmallTables || 0}, déjà allouées : ${currentTotals.totalSmall})`
            )
        }

        if (newTotals.large > festivalLimits.large) {
            errors.push(
                `Dépassement de grandes tables : ${newTotals.large}/${festivalLimits.large} (vous essayez d'ajouter ${nbLargeTables || 0}, déjà allouées : ${currentTotals.totalLarge})`
            )
        }

        if (newTotals.cityHall > festivalLimits.cityHall) {
            errors.push(
                `Dépassement de tables mairie : ${newTotals.cityHall}/${festivalLimits.cityHall} (vous essayez d'ajouter ${nbCityHallTables || 0}, déjà allouées : ${currentTotals.totalCity})`
            )
        }

        if (errors.length > 0) {
            return {
                valid: false,
                error: errors.join(' | ')
            }
        }

        return { valid: true }

    } catch (err: any) {
        console.error('Erreur lors de la validation des limites de tables:', err)
        return {
            valid: false,
            error: 'Erreur lors de la validation des limites de tables'
        }
    }
}
