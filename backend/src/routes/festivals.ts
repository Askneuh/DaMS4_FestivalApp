import { Router } from 'express'
//import pool from '../db/database.ts'
import bcrypt from 'bcryptjs'
//import { requireAdmin } from '../middleware/auth-admin.ts'

import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()
//Route pour récupérer les données d'un festival dont le nom (unique) est passé en paramètre.
router.get('/:festivalName', async (req, res) => {
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
router.post('/', async (req, res) => {
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, begin_date, end_date } = req.body;
    const dateActuelle: Date = new Date();
    //Gérer le fuseau horaire et formate pour le type Date de postgres
    const decalageFuseauHoraire_ms: number = dateActuelle.getTimezoneOffset() * 60 * 1000;
    const dateAjustee: Date = new Date(dateActuelle.getTime() - decalageFuseauHoraire_ms);
    const creation_date: string = dateAjustee.toISOString().substring(0, 10);
    const tariffZones = req.body.tariffZones;
    //On a dit que un super orga peut créer un festival sans rentrer toutes les infos donc on vérifie
    //seulement le nom (clé primaire)
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

            const festivalRes = await client.query(
                'INSERT INTO "festival" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "remainingSmallTables", "remainingLargeTables", "remainingCityHallTables", "creation_date", "begin_date", "end_date") VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9) RETURNING *',
                [name, smallTables, largeTables, cityHallTables, smallTables, largeTables, cityHallTables, begin_date || null, end_date || null]
            );

            await client.query('COMMIT');
            return res.status(201).json(festivalRes.rows[0]);
        }
        catch (err: any) {
            //Catch les erreurs d'unicité, ici de la clé primaire 
            await client.query('ROLLBACK');
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

router.post('/update/:festivalName', async (req, res) => {
    const festivalNameParam = req.params.festivalName;
    const { nbSmallTables, nbLargeTables, nbCityHallTables, remainingSmallTables, remainingLargeTables, remainingCityHallTables, begin_date, end_date } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const updateFestivalQuery = `
            UPDATE "festival" 
            SET "nbSmallTables" = COALESCE($1, "nbSmallTables"), 
                "nbLargeTables" = COALESCE($2, "nbLargeTables"),
                "nbCityHallTables" = COALESCE($3, "nbCityHallTables"),
                "remainingSmallTables" = COALESCE($4, "remainingSmallTables"),
                "remainingLargeTables" = COALESCE($5, "remainingLargeTables"),
                "remainingCityHallTables" = COALESCE($6, "remainingCityHallTables"),
                "begin_date" = COALESCE($7, "begin_date"), 
                "end_date" = COALESCE($8, "end_date") 
            WHERE "name" = $9 
            RETURNING *`;
        const { rowCount, rows } = await client.query(updateFestivalQuery, [nbSmallTables, nbLargeTables, nbCityHallTables, remainingSmallTables, remainingLargeTables, remainingCityHallTables, begin_date, end_date, festivalNameParam]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Festival non trouvé" });
        }

        const { rows: tzRows } = await client.query(
            'SELECT * FROM "tariffZone" WHERE "festivalName" = $1',
            [festivalNameParam]
        );

        await client.query('COMMIT');


        res.status(200).json(rows[0]);
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
router.get('/', async (req, res) => {
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
router.delete('/:festivalName', requireAdmin, async (req, res) => {
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