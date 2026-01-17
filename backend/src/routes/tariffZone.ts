import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { validateTariffZoneTableLimits } from '../middleware/validate-tariff-zone.js'

const router = Router()

// Route de récupération de toutes les zones tarifaires d'un festival
// IMPORTANT: Cette route doit être AVANT /:tzId pour éviter les conflits de matching
router.get('/festival/:festivalName', async (req, res) => {
    const festivalName = req.params.festivalName;
    try {
        const { rows } = await pool.query('SELECT * FROM "tariffZone" WHERE "festivalName" = $1', [festivalName]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Aucune zone tarifaire trouvée pour ce festival" });
        }
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer une zone tarifaire par son ID
router.get('/:tzId', async (req, res) => {
    const tzId = req.params.tzId
    try {
        const { rows } = await pool.query('SELECT * FROM "tariffZone" WHERE "idTZ" = $1', [tzId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une zone tarifaire
router.post('/', requireAdmin, async (req, res) => {
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, smallTablePrice, largeTablePrice, cityHallTablePrice, squareMeterPrice, festivalName } = req.body
    if (!festivalName) {
        return res.status(400).json({ error: "Nom du festival obligatoire pour la création de zone tarifaire" })
    }
    try {
        const smallTables = nbSmallTables || 0;
        const largeTables = nbLargeTables || 0;
        const cityHallTables = nbCityHallTables || 0;

        // Validate table limits before creating the zone
        const validation = await validateTariffZoneTableLimits(
            festivalName,
            smallTables,
            largeTables,
            cityHallTables
        );

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { rows } = await pool.query(
            'INSERT INTO "tariffZone" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "smallTablePrice", "largeTablePrice", "cityHallTablePrice", "squareMeterPrice", "festivalName") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING "idTZ"',
            [name, smallTables, largeTables, cityHallTables, smallTables, largeTables, cityHallTables, smallTablePrice, largeTablePrice, cityHallTablePrice, squareMeterPrice, festivalName]
        )
        return res.status(201).json({ message: 'Zone tarifaire créée', id: rows[0].idtz })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de la zone tariffaire déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour d'une zone tarifaire
router.post('/update/:tzId', requireAdmin, async (req, res) => {
    const tzId = req.params.tzId
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, remainingSmallTables, remainingLargeTables, remainingCityHallTables, smallTablePrice, largeTablePrice, cityHallTablePrice, squareMeterPrice } = req.body
    try {
        // Get the festival name for this tariff zone
        const tzQuery = await pool.query(
            'SELECT "festivalName" FROM "tariffZone" WHERE "idTZ" = $1',
            [tzId]
        );

        if (tzQuery.rows.length === 0) {
            return res.status(404).json({ error: "Zone tarifaire non trouvée" });
        }

        const festivalName = tzQuery.rows[0].festivalName;

        // Validate table limits if any table counts are being updated
        if (nbSmallTables !== undefined || nbLargeTables !== undefined || nbCityHallTables !== undefined) {
            // Get current values if not all are provided
            const currentQuery = await pool.query(
                'SELECT "nbSmallTables", "nbLargeTables", "nbCityHallTables" FROM "tariffZone" WHERE "idTZ" = $1',
                [tzId]
            );
            const current = currentQuery.rows[0];

            const validation = await validateTariffZoneTableLimits(
                festivalName,
                nbSmallTables !== undefined ? nbSmallTables : current.nbSmallTables,
                nbLargeTables !== undefined ? nbLargeTables : current.nbLargeTables,
                nbCityHallTables !== undefined ? nbCityHallTables : current.nbCityHallTables,
                parseInt(tzId) // Exclude this zone from totals
            );

            if (!validation.valid) {
                return res.status(400).json({ error: validation.error });
            }
        }

        const { rowCount } = await pool.query(
            'UPDATE "tariffZone" SET "name" = COALESCE($1, "name"), "nbSmallTables" = COALESCE($2, "nbSmallTables"), "nbLargeTables" = COALESCE($3, "nbLargeTables"), "nbCityHallTables" = COALESCE($4, "nbCityHallTables"), "remainingSmallTables" = COALESCE($5, "remainingSmallTables"), "remainingLargeTables" = COALESCE($6, "remainingLargeTables"), "remainingCityHallTables" = COALESCE($7, "remainingCityHallTables"), "smallTablePrice" = COALESCE($8, "smallTablePrice"), "largeTablePrice" = COALESCE($9, "largeTablePrice"), "cityHallTablePrice" = COALESCE($10, "cityHallTablePrice"), "squareMeterPrice" = COALESCE($11, "squareMeterPrice") WHERE "idTZ" = $12',
            [name, nbSmallTables, nbLargeTables, nbCityHallTables, remainingSmallTables, remainingLargeTables, remainingCityHallTables, smallTablePrice, largeTablePrice, cityHallTablePrice, squareMeterPrice, tzId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Zone tarifaire non trouvée" })
        }
        return res.status(200).json({ message: 'Zone tarifaire mise à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de suppression d'une zone tarifaire par ID
router.delete('/:tzId', requireAdmin, async (req, res) => {
    const tzId = req.params.tzId;
    try {
        const { rowCount } = await pool.query('DELETE FROM "tariffZone" WHERE "idTZ" = $1', [tzId]);
        if (rowCount === 0) {
            return res.status(404).json({ error: "Zone tarifaire non trouvée" });
        }
        return res.status(200).json({ message: 'Zone tarifaire supprimée' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router
