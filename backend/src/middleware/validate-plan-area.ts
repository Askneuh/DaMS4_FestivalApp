import pool from '../db/database.js'

/**
 * Validation result interface
 */
interface ValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validates that the total number of tables across all plan areas
 * for a tariff zone does not exceed the tariff zone's available table capacity.
 * 
 * @param idTZ - ID of the tariff zone
 * @param nbSmallTables - Number of small tables for the plan area being created/updated
 * @param nbLargeTables - Number of large tables for the plan area being created/updated
 * @param nbCityHallTables - Number of city hall tables for the plan area being created/updated
 * @param excludePlanAreaId - Optional. For updates, the ID of the plan area being updated (to exclude from totals)
 * @returns ValidationResult with valid flag and optional error message
 */
export async function validatePlanAreaTableLimits(
    idTZ: number,
    nbSmallTables: number,
    nbLargeTables: number,
    nbCityHallTables: number,
    excludePlanAreaId?: number
): Promise<ValidationResult> {
    try {
        // Get tariff zone table limits
        const tzQuery = await pool.query(
            'SELECT "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables" FROM "tariffZone" WHERE "idTZ" = $1',
            [idTZ]
        )

        if (tzQuery.rows.length === 0) {
            return {
                valid: false,
                error: `Zone tarifaire avec ID ${idTZ} non trouvée`
            }
        }

        const tariffZone = tzQuery.rows[0]
        const tzLimits = {
            small: tariffZone.nbSmallTables,
            large: tariffZone.nbLargeTables,
            cityHall: tariffZone.nbCityHallTables,
            remainingSmall: tariffZone.remainingSmallTables,
            remainingLarge: tariffZone.remainingLargeTables,
            remainingCityHall: tariffZone.remainingCityHallTables
        }

        // Get current totals from all plan areas (excluding the one being updated if applicable)
        let totalTablesQuery
        if (excludePlanAreaId) {
            totalTablesQuery = await pool.query(
                `SELECT 
                    COALESCE(SUM("nbSmallTables"), 0) as "totalSmall",
                    COALESCE(SUM("nbLargeTables"), 0) as "totalLarge",
                    COALESCE(SUM("nbCityHallTables"), 0) as "totalCity"
                 FROM "planArea" 
                 WHERE "idTZ" = $1 AND "id" != $2`,
                [idTZ, excludePlanAreaId]
            )
        } else {
            totalTablesQuery = await pool.query(
                `SELECT 
                    COALESCE(SUM("nbSmallTables"), 0) as "totalSmall",
                    COALESCE(SUM("nbLargeTables"), 0) as "totalLarge",
                    COALESCE(SUM("nbCityHallTables"), 0) as "totalCity"
                 FROM "planArea" 
                 WHERE "idTZ" = $1`,
                [idTZ]
            )
        }

        const currentTotals = totalTablesQuery.rows[0]

        // Calculate new totals with the plan area being created/updated
        const newTotals = {
            small: parseInt(currentTotals.totalSmall) + (nbSmallTables || 0),
            large: parseInt(currentTotals.totalLarge) + (nbLargeTables || 0),
            cityHall: parseInt(currentTotals.totalCity) + (nbCityHallTables || 0)
        }

        // Check for violations against tariff zone limits
        const errors: string[] = []

        if (newTotals.small > tzLimits.small) {
            errors.push(
                `Dépassement de petites tables : ${newTotals.small}/${tzLimits.small} (vous essayez d'ajouter ${nbSmallTables || 0}, déjà allouées : ${currentTotals.totalSmall})`
            )
        }

        if (newTotals.large > tzLimits.large) {
            errors.push(
                `Dépassement de grandes tables : ${newTotals.large}/${tzLimits.large} (vous essayez d'ajouter ${nbLargeTables || 0}, déjà allouées : ${currentTotals.totalLarge})`
            )
        }

        if (newTotals.cityHall > tzLimits.cityHall) {
            errors.push(
                `Dépassement de tables mairie : ${newTotals.cityHall}/${tzLimits.cityHall} (vous essayez d'ajouter ${nbCityHallTables || 0}, déjà allouées : ${currentTotals.totalCity})`
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
        console.error('Erreur lors de la validation des limites de tables pour zone de plan:', err)
        return {
            valid: false,
            error: 'Erreur lors de la validation des limites de tables'
        }
    }
}
