import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

router.get('/:reservationId', requireAdmin, async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const query = `
            SELECT r.*, 
                   e."id" as editor_id, e."name" as editor_name, e."exposant", e."distributeur", e."logo",
                   COALESCE(
                       (SELECT json_agg(g.*) 
                        FROM game g 
                        WHERE g."idEditor" = e."id"), 
                       '[]'
                   ) as editor_games
            FROM reservation r
            JOIN editor e ON r.idEditor = e."id"
            WHERE r.idReservation = $1
        `;
        const { rows } = await pool.query(query, [reservationId])

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Réservation non trouvée' });
        }

        const row = rows[0];

        // Map PostgreSQL lowercase column names to camelCase
        const reservation = {
            idReservation: row.idreservation,
            idEditor: row.ideditor,
            status: row.status,
            nbSmallTables: row.nbsmalltables,
            nbLargeTables: row.nblargetables,
            nbCityHallTables: row.nbcityhalltables,
            remise: row.remise,
            typeAnimateur: row.typeanimateur,
            listeDemandee: row.listedemandee,
            listeRecue: row.listerecue,
            jeuxRecus: row.jeuxrecus,
            festivalName: row.festivalname,
            editor: {
                id: row.editor_id,
                name: row.editor_name,
                exposant: row.exposant,
                distributeur: row.distributeur,
                logo: row.logo,
                games: row.editor_games
            }
        };

        res.json(reservation)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une réservation
router.post('/', requireAdmin, async (req, res) => {
    const { idEditor, status, nbSmallTables, nbLargeTables, nbCityHallTables, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, festivalName } = req.body
    if (!idEditor) {
        return res.status(400).json({ error: "ID de l'éditeur obligatoire pour la création de réservation" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO reservation (idEditor, status, nbSmallTables, nbLargeTables, nbCityHallTables, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, festivalName) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING idReservation',
            [idEditor, status, nbSmallTables, nbLargeTables, nbCityHallTables, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, festivalName]
        )
        return res.status(201).json({ message: 'Réservation créée', id: rows[0].idReservation })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de la réservation déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour d'une réservation
router.post('/update/:reservationId', requireAdmin, async (req, res) => {
    const reservationId = req.params.reservationId
    const { status, nbSmallTables, nbLargeTables, nbCityHallTables, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus } = req.body
    try {
        const { rowCount } = await pool.query(
            'UPDATE reservation SET status = $1, nbSmallTables = $2, nbLargeTables = $3, nbCityHallTables = $4, remise = $5, typeAnimateur = $6, listeDemandee = $7, listeRecue = $8, jeuxRecus = $9 WHERE idReservation = $10',
            [status, nbSmallTables, nbLargeTables, nbCityHallTables, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, reservationId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Réservation non trouvée" })
        }
        return res.status(200).json({ message: 'Réservation mise à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer les réservations d'un editeur 
router.get('/byEditor/:idEditor', requireAdmin, async (req, res) => {
    const idEditor = req.params.idEditor
    try {
        const query = `
            SELECT r.*, 
                   e."id" as editor_id, e."name" as editor_name, e."exposant", e."distributeur", e."logo",
                   COALESCE(
                       (SELECT json_agg(g.*) 
                        FROM game g 
                        WHERE g."idEditor" = e."id"), 
                       '[]'
                   ) as editor_games
            FROM reservation r
            JOIN editor e ON r.idEditor = e."id"
            WHERE r.idEditor = $1
        `;
        const { rows } = await pool.query(query, [idEditor])

        const reservations = rows.map(row => ({
            idReservation: row.idreservation,
            idEditor: row.ideditor,
            status: row.status,
            nbSmallTables: row.nbsmalltables,
            nbLargeTables: row.nblargetables,
            nbCityHallTables: row.nbcityhalltables,
            remise: row.remise,
            typeAnimateur: row.typeanimateur,
            listeDemandee: row.listedemandee,
            listeRecue: row.listerecue,
            jeuxRecus: row.jeuxrecus,
            festivalName: row.festivalname,
            editor: {
                id: row.editor_id,
                name: row.editor_name,
                exposant: row.exposant,
                distributeur: row.distributeur,
                logo: row.logo,
                games: row.editor_games
            }
        }));

        res.json(reservations)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

//Route pour récupérer les réservations d'un festival
router.get('/byFestival/:festivalName', requireAdmin, async (req, res) => {
    const festivalName = req.params.festivalName
    try {
        const query = `
            SELECT r.*, 
                   e."id" as editor_id, e."name" as editor_name, e."exposant", e."distributeur", e."logo",
                   COALESCE(
                       (SELECT json_agg(g.*) 
                        FROM game g 
                        WHERE g."idEditor" = e."id"), 
                       '[]'
                   ) as editor_games
            FROM reservation r
            JOIN editor e ON r.idEditor = e."id"
            WHERE r.festivalName = $1
        `;
        const { rows } = await pool.query(query, [festivalName])

        const reservations = rows.map(row => ({
            idReservation: row.idreservation,
            idEditor: row.ideditor,
            status: row.status,
            nbSmallTables: row.nbsmalltables,
            nbLargeTables: row.nblargetables,
            nbCityHallTables: row.nbcityhalltables,
            remise: row.remise,
            typeAnimateur: row.typeanimateur,
            listeDemandee: row.listedemandee,
            listeRecue: row.listerecue,
            jeuxRecus: row.jeuxrecus,
            festivalName: row.festivalname,
            editor: {
                id: row.editor_id,
                name: row.editor_name,
                exposant: row.exposant,
                distributeur: row.distributeur,
                logo: row.logo,
                games: row.editor_games
            }
        }));

        res.json(reservations)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})


export default router