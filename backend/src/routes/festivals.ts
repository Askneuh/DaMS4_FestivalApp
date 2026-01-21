import { Router } from 'express'
//import pool from '../db/database.ts'
import bcrypt from 'bcryptjs'
//import { requireAdmin } from '../middleware/auth-admin.ts'

import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'
import { getCurrentDate } from '../utils/date.js'
import { validateStringLengths, normalizeBooleans } from '../middleware/validation.js'

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
router.post('/', verifyToken, requireOrganizer, validateStringLengths({ name: 255 }), normalizeBooleans(['isCurrent']), async (req, res) => {
    const { name, begin_date, end_date } = req.body;
    const tariffZones = req.body.tariffZones;

    const client = await pool.connect();
    if (!name) {
        console.error("Nom du festival manquant lors de la création");
        return res.status(400).json({ error: "Nom du festival obligatoire pour la création" })
    }

    // At least one zone is mandatory
    if (!tariffZones || !Array.isArray(tariffZones) || tariffZones.length === 0) {
        return res.status(400).json({ error: "Au moins une zone tarifaire est obligatoire." });
    }

    try {
        await client.query('BEGIN');

        // Compute totals from zones
        let totalSmall = 0;
        let totalLarge = 0;
        let totalCityHall = 0;

        for (const zone of tariffZones) {
            totalSmall += zone.nbSmallTables || 0;
            totalLarge += zone.nbLargeTables || 0;
            totalCityHall += zone.nbCityHallTables || 0;
        }

        // Le nouveau festival devient toujours le festival courant
        const isCurrent = true;

        // Désactiver tous les autres festivals courants
        await client.query(
            'UPDATE "festival" SET "isCurrent" = FALSE WHERE "isCurrent" = TRUE'
        );

        const festivalRes = await client.query(
            'INSERT INTO "festival" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "creation_date", "begin_date", "end_date", "isCurrent") VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10) RETURNING *',
            [name, totalSmall, totalLarge, totalCityHall, totalSmall, totalLarge, totalCityHall, begin_date || null, end_date || null, isCurrent]
        );

        // Insert zones
        for (const zone of tariffZones) {
            await client.query(
                'INSERT INTO "tariffZone" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "smallTablePrice", "largeTablePrice", "cityHallTablePrice", "squareMeterPrice", "festivalName") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                [
                    zone.name,
                    zone.nbSmallTables || 0,
                    zone.nbLargeTables || 0,
                    zone.nbCityHallTables || 0,
                    zone.nbSmallTables || 0,
                    zone.nbLargeTables || 0,
                    zone.nbCityHallTables || 0,
                    zone.smallTablePrice || 0,
                    zone.largeTablePrice || 0,
                    zone.cityHallTablePrice || 0,
                    zone.squareMeterPrice || 0,
                    name
                ]
            );
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
})

router.post('/update/:festivalName', verifyToken, requireOrganizer, validateStringLengths({ festivalName: 255 }), normalizeBooleans(['isCurrent']), async (req, res) => {
    const festivalNameParam = req.params.festivalName;
    const { begin_date, end_date } = req.body;
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

        // Fetch current festival data
        const { rows: currentFestivalRows } = await client.query(
            'SELECT * FROM "festival" WHERE "name" = $1',
            [festivalNameParam]
        );

        if (currentFestivalRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Festival non trouvé" });
        }

        // Update or insert zones first
        if (tariffZones && Array.isArray(tariffZones)) {
            for (const zone of tariffZones) {
                if (zone.idTZ && zone.idTZ > 0) {
                    // Update - DO NOT overwrite remainingSmallTables etc. to preserve reservations
                    await client.query(
                        'UPDATE "tariffZone" SET "name" = $1, "nbSmallTables" = $2, "nbLargeTables" = $3, "nbCityHallTables" = $4, "smallTablePrice" = $5, "largeTablePrice" = $6, "cityHallTablePrice" = $7, "squareMeterPrice" = $8 WHERE "idTZ" = $9',
                        [
                            zone.name,
                            zone.nbSmallTables,
                            zone.nbLargeTables,
                            zone.nbCityHallTables,
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
                            zone.nbSmallTables || 0,
                            zone.nbLargeTables || 0,
                            zone.nbCityHallTables || 0,
                            zone.smallTablePrice || 0,
                            zone.largeTablePrice || 0,
                            zone.cityHallTablePrice || 0,
                            zone.squareMeterPrice || 0,
                            festivalNameParam
                        ]
                    );
                }
            }
        }

        // Recalculate festival totals from all zones
        const { rows: allZones } = await client.query(
            'SELECT * FROM "tariffZone" WHERE "festivalName" = $1',
            [festivalNameParam]
        );

        let totalSmall = 0;
        let totalLarge = 0;
        let totalCityHall = 0;
        let remainingSmall = 0;
        let remainingLarge = 0;
        let remainingCityHall = 0;

        for (const z of allZones) {
            totalSmall += z.nbSmallTables || 0;
            totalLarge += z.nbLargeTables || 0;
            totalCityHall += z.nbCityHallTables || 0;
            remainingSmall += z.remainingSmallTables || 0;
            remainingLarge += z.remainingLargeTables || 0;
            remainingCityHall += z.remainingCityHallTables || 0;
        }

        const updateFestivalQuery = `
            UPDATE "festival" 
            SET "nbSmallTables" = $1, 
                "nbLargeTables" = $2,
                "nbCityHallTables" = $3,
                "remainingSmallTables" = $4,
                "remainingLargeTables" = $5,
                "remainingCityHallTables" = $6,
                "begin_date" = COALESCE($7, "begin_date"), 
                "end_date" = COALESCE($8, "end_date"),
                "isCurrent" = COALESCE($9, "isCurrent")
            WHERE "name" = $10 
            RETURNING *`;
        const { rowCount, rows } = await client.query(updateFestivalQuery, [totalSmall, totalLarge, totalCityHall, remainingSmall, remainingLarge, remainingCityHall, begin_date, end_date, isCurrent, festivalNameParam]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Festival non trouvé" });
        }

        await client.query('COMMIT');

        // Retourner le festival avec ses zones à jour
        const festivalWithZones = {
            ...rows[0],
            tariffZones: allZones
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

router.get('/:festivalName/games', verifyToken, async (req, res) => {
    const festivalName = req.params.festivalName;
    try {
        const query = `
            SELECT 
                g.id,
                g.name,
                g.author,
                e.name as "editorName",
                gt."gameTypeLabel",
                rg."quantity" as "reservedQuantity",
                rg."isGamePlaced",
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', pa.id,
                        'name', pa.name
                    )) FILTER (WHERE pa.id IS NOT NULL),
                    '[]'::json
                ) as "planAreas"
            FROM "reservation" r
            JOIN "reservation_game" rg ON r."idReservation" = rg."idReservation"
            JOIN "game" g ON rg."idGame" = g.id
            LEFT JOIN "editor" e ON g."idEditor" = e.id
            LEFT JOIN "gameType" gt ON g."idGameType" = gt.id
            LEFT JOIN "game_planArea" gpa ON g.id = gpa."idGame" AND gpa."idReservation" = r."idReservation"
            LEFT JOIN "planArea" pa ON gpa."idPA" = pa.id
            WHERE r."festivalName" = $1
            GROUP BY g.id, g.name, g.author, e.name, gt."gameTypeLabel", rg."quantity", rg."isGamePlaced"
            ORDER BY g.name
        `;

        const { rows } = await pool.query(query, [festivalName]);
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

//Route pour supprimer un festival par son nom
router.delete('/:festivalName', verifyToken, requireAdmin, async (req, res) => {
    const festivalName = req.params.festivalName;
    try {
        const { rowCount } = await pool.query('DELETE FROM "festival" WHERE "name" = $1', [festivalName]);

        if (rowCount === 0) {
            return res.status(404).json({ error: "Festival non trouvé" });
        }

        res.status(200).json({ message: 'Festival supprimé' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router