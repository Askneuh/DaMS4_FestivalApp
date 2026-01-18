import { Router } from 'express'
//import pool from '../db/database.ts'
import bcrypt from 'bcryptjs'
//import { requireAdmin } from '../middleware/auth-admin.ts'

import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer le festival courant
router.get('/current', verifyToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            'SELECT * FROM "festival" WHERE "isCurrent" = TRUE'
        );

        if (rows.length === 0) {
            await client.query('COMMIT');
            return res.status(404).json({ error: 'Aucun festival courant défini' });
        }

        const { rows: tzRows } = await client.query(
            'SELECT * FROM "tariffZone" WHERE "festivalName" = $1',
            [rows[0].name]
        );

        const festivalWithZones = {
            ...rows[0],
            tariffZones: tzRows
        };

        res.json(festivalWithZones);
        await client.query('COMMIT');
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

// Route pour définir un festival comme courant
router.post('/current/:festivalName', verifyToken, requireOrganizer, async (req, res) => {
    const festivalName = req.params.festivalName;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Vérifier que le festival existe
        const { rows: festivalRows } = await client.query(
            'SELECT * FROM "festival" WHERE "name" = $1',
            [festivalName]
        );

        if (festivalRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Festival non trouvé' });
        }

        // Désactiver tous les festivals courants
        await client.query(
            'UPDATE "festival" SET "isCurrent" = FALSE WHERE "isCurrent" = TRUE'
        );

        // Activer le festival spécifié
        const { rows } = await client.query(
            'UPDATE "festival" SET "isCurrent" = TRUE WHERE "name" = $1 RETURNING *',
            [festivalName]
        );

        // Récupérer les zones tarifaires
        const { rows: tzRows } = await client.query(
            'SELECT * FROM "tariffZone" WHERE "festivalName" = $1',
            [festivalName]
        );

        const festivalWithZones = {
            ...rows[0],
            tariffZones: tzRows
        };

        await client.query('COMMIT');
        res.status(200).json(festivalWithZones);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});


//Route pour récupérer les données d'un festival dont le nom (unique) est passé en paramètre.
router.get('/:festivalName', verifyToken, async (req, res) => {
    const festivalName = req.params.festivalName;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            'SELECT * FROM "festival" WHERE "name" = $1',
            [festivalName]
        );
        const { rows: tzRows } = await client.query(
            'SELECT * FROM "tariffZone" WHERE "festivalName" = $1',
            [festivalName]
        );
        const festivalWithZones = {
            ...rows[0],
            tariffZones: tzRows
        };
        res.json(festivalWithZones);
        await client.query('COMMIT');

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    } finally {
        client.release();
    }
});
//Route pour la création d'un festival
router.post('/', verifyToken, requireOrganizer, async (req, res) => {
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, begin_date, end_date } = req.body;
    const dateActuelle: Date = new Date();
    //Gérer le fuseau horaire et formate pour le type Date de postgres
    const decalageFuseauHoraire_ms: number = dateActuelle.getTimezoneOffset() * 60 * 1000;
    const dateAjustee: Date = new Date(dateActuelle.getTime() - decalageFuseauHoraire_ms);
    const creation_date: string = dateAjustee.toISOString().substring(0, 10);
    const tariffZones = req.body.tariffZones;

    const client = await pool.connect();
    if (!name) {
        console.error("Nom du festival manquant lors de la création");
        return res.status(400).json({ error: "Nom du festival obligatoire pour la création" })
    }

    else {
        try {
            await client.query('BEGIN');
            const smallTables = nbSmallTables || 0;
            const largeTables = nbLargeTables || 0;
            const cityHallTables = nbCityHallTables || 0;

            // Validation des allocations de tables
            if (tariffZones && Array.isArray(tariffZones)) {
                let allocatedSmall = 0;
                let allocatedLarge = 0;
                let allocatedCityHall = 0;

                for (const zone of tariffZones) {
                    allocatedSmall += zone.nbSmallTables || 0;
                    allocatedLarge += zone.nbLargeTables || 0;
                    allocatedCityHall += zone.nbCityHallTables || 0;
                }

                if (allocatedSmall > smallTables) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: `Le nombre de petites tables allouées (${allocatedSmall}) dépasse le total disponible (${smallTables}).` });
                }
                if (allocatedLarge > largeTables) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: `Le nombre de grandes tables allouées (${allocatedLarge}) dépasse le total disponible (${largeTables}).` });
                }
                if (allocatedCityHall > cityHallTables) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: `Le nombre de tables de mairie allouées (${allocatedCityHall}) dépasse le total disponible (${cityHallTables}).` });
                }
            }

            // Le nouveau festival devient toujours le festival courant
            const isCurrent = true;

            // Désactiver tous les autres festivals courants
            await client.query(
                'UPDATE "festival" SET "isCurrent" = FALSE WHERE "isCurrent" = TRUE'
            );

            const festivalRes = await client.query(
                'INSERT INTO "festival" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "creation_date", "begin_date", "end_date", "isCurrent") VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10) RETURNING *',
                [name, smallTables, largeTables, cityHallTables, smallTables, largeTables, cityHallTables, begin_date || null, end_date || null, isCurrent]
            );

            // Gestion des zones tarifaires
            if (tariffZones && Array.isArray(tariffZones)) {
                for (const zone of tariffZones) {
                    await client.query(
                        'INSERT INTO "tariffZone" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "smallTablePrice", "largeTablePrice", "cityHallTablePrice", "squareMeterPrice", "festivalName") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                        [
                            zone.name,
                            zone.nbSmallTables || 0,
                            zone.nbLargeTables || 0,
                            zone.nbCityHallTables || 0,
                            zone.remainingSmallTables || zone.nbSmallTables || 0,
                            zone.remainingLargeTables || zone.nbLargeTables || 0,
                            zone.remainingCityHallTables || zone.nbCityHallTables || 0,
                            zone.smallTablePrice || 0,
                            zone.largeTablePrice || 0,
                            zone.cityHallTablePrice || 0,
                            zone.squareMeterPrice || 0,
                            name
                        ]
                    );
                }
            }

            await client.query('COMMIT');
            return res.status(201).json(festivalRes.rows[0]);
        }
        catch (err: any) {
            await client.query('ROLLBACK');
            //Catch les erreurs d'unicité, ici de la clé primaire 
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Nom du festival déjà existant' })
            } else {
                console.error(err);
                return res.status(500).json({ error: 'Erreur serveur' })
            }
        }
        finally {
            client.release();
        }
    }
})

router.post('/update/:festivalName', verifyToken, requireOrganizer, async (req, res) => {
    const festivalNameParam = req.params.festivalName;
    const { nbSmallTables, nbLargeTables, nbCityHallTables, remainingSmallTables, remainingLargeTables, remainingCityHallTables, begin_date, end_date } = req.body;
    const tariffZones = req.body.tariffZones;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const isCurrent = req.body.isCurrent;

        // Si le festival doit devenir courant, désactiver les autres
        if (isCurrent === true) {
            await client.query(
                'UPDATE "festival" SET "isCurrent" = FALSE WHERE "isCurrent" = TRUE AND "name" != $1',
                [festivalNameParam]
            );
        }

        // Fetch current festival data to handle partial updates and validation
        const { rows: currentFestivalRows } = await client.query(
            'SELECT * FROM "festival" WHERE "name" = $1',
            [festivalNameParam]
        );

        if (currentFestivalRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Festival non trouvé" });
        }

        const currentFestival = currentFestivalRows[0];
        const newNbSmallTables = nbSmallTables !== undefined ? nbSmallTables : currentFestival.nbSmallTables;
        const newNbLargeTables = nbLargeTables !== undefined ? nbLargeTables : currentFestival.nbLargeTables;
        const newNbCityHallTables = nbCityHallTables !== undefined ? nbCityHallTables : currentFestival.nbCityHallTables;

        // Validation des allocations de tables
        if (tariffZones && Array.isArray(tariffZones)) {
            let allocatedSmall = 0;
            let allocatedLarge = 0;
            let allocatedCityHall = 0;

            for (const zone of tariffZones) {
                allocatedSmall += zone.nbSmallTables || 0;
                allocatedLarge += zone.nbLargeTables || 0;
                allocatedCityHall += zone.nbCityHallTables || 0;
            }

            if (allocatedSmall > newNbSmallTables) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Le nombre de petites tables allouées (${allocatedSmall}) dépasse le total disponible (${newNbSmallTables}).` });
            }
            if (allocatedLarge > newNbLargeTables) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Le nombre de grandes tables allouées (${allocatedLarge}) dépasse le total disponible (${newNbLargeTables}).` });
            }
            if (allocatedCityHall > newNbCityHallTables) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Le nombre de tables de mairie allouées (${allocatedCityHall}) dépasse le total disponible (${newNbCityHallTables}).` });
            }
        }

        const updateFestivalQuery = `
            UPDATE "festival" 
            SET "nbSmallTables" = $1, 
                "nbLargeTables" = $2,
                "nbCityHallTables" = $3,
                "remainingSmallTables" = COALESCE($4, "remainingSmallTables"),
                "remainingLargeTables" = COALESCE($5, "remainingLargeTables"),
                "remainingCityHallTables" = COALESCE($6, "remainingCityHallTables"),
                "begin_date" = $7, 
                "end_date" = $8,
                "isCurrent" = COALESCE($9, "isCurrent")
            WHERE "name" = $10 
            RETURNING *`;
        // Use explicitly calculated new totals instead of relying on COALESCE in SQL for the totals, to ensure consistency with validation
        const { rowCount, rows } = await client.query(updateFestivalQuery, [newNbSmallTables, newNbLargeTables, newNbCityHallTables, remainingSmallTables, remainingLargeTables, remainingCityHallTables, begin_date, end_date, isCurrent, festivalNameParam]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Festival non trouvé" });
        }

        // Gestion des zones tarifaires (Update ou Insert)
        if (tariffZones && Array.isArray(tariffZones)) {
            for (const zone of tariffZones) {
                if (zone.idTZ && zone.idTZ > 0) {
                    // Update
                    await client.query(
                        'UPDATE "tariffZone" SET "name" = $1, "nbSmallTables" = $2, "nbLargeTables" = $3, "nbCityHallTables" = $4, "remainingSmallTables" = $5, "remainingLargeTables" = $6, "remainingCityHallTables" = $7, "smallTablePrice" = $8, "largeTablePrice" = $9, "cityHallTablePrice" = $10, "squareMeterPrice" = $11 WHERE "idTZ" = $12',
                        [
                            zone.name,
                            zone.nbSmallTables,
                            zone.nbLargeTables,
                            zone.nbCityHallTables,
                            zone.remainingSmallTables,
                            zone.remainingLargeTables,
                            zone.remainingCityHallTables,
                            zone.smallTablePrice,
                            zone.largeTablePrice,
                            zone.cityHallTablePrice,
                            zone.squareMeterPrice,
                            zone.idTZ
                        ]
                    );
                } else {
                    // Insert
                    await client.query(
                        'INSERT INTO "tariffZone" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "smallTablePrice", "largeTablePrice", "cityHallTablePrice", "squareMeterPrice", "festivalName") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                        [
                            zone.name,
                            zone.nbSmallTables || 0,
                            zone.nbLargeTables || 0,
                            zone.nbCityHallTables || 0,
                            zone.remainingSmallTables || zone.nbSmallTables || 0,
                            zone.remainingLargeTables || zone.nbLargeTables || 0,
                            zone.remainingCityHallTables || zone.nbCityHallTables || 0,
                            zone.smallTablePrice || 0,
                            zone.largeTablePrice || 0,
                            zone.cityHallTablePrice || 0,
                            zone.squareMeterPrice || 0,
                            festivalNameParam // On lie à ce festival
                        ]
                    );
                }
            }
        }

        const { rows: tzRows } = await client.query(
            'SELECT * FROM "tariffZone" WHERE "festivalName" = $1',
            [festivalNameParam]
        );

        await client.query('COMMIT');

        // Retourner le festival avec ses zones à jour
        const festivalWithZones = {
            ...rows[0],
            tariffZones: tzRows
        };

        res.status(200).json(festivalWithZones);
    }
    catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

//Route pour récupérer tous les festivals
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT f.*,
                COALESCE(
                    json_agg(tz.*) FILTER (WHERE tz."idTZ" IS NOT NULL),
                    '[]'::json
                ) AS "tariffZones"
            FROM "festival" f
            LEFT JOIN "tariffZone" tz ON f."name" = tz."festivalName"
            GROUP BY f."name"
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

//Route pour supprimer un festival par son nom
router.delete('/:festivalName', verifyToken, requireAdmin, async (req, res) => {
    const festivalName = req.params.festivalName;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM "tariffZone" WHERE "festivalName" = $1', [festivalName]);
        const { rowCount } = await client.query('DELETE FROM "festival" WHERE "name" = $1', [festivalName]);
        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Festival non trouvé" });
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Festival supprimé' });
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

export default router