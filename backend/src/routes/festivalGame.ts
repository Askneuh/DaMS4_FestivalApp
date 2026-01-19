import { Router } from 'express'
import pool from '../db/database.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer tous les jeux présentés lors d'un festival
router.get('/byFestival/:festivalName', verifyToken, async (req, res) => {
    const festivalName = req.params.festivalName
    try {
        const query = `
            SELECT DISTINCT g.*, rg."isGamePlaced"
            FROM "game" g
            INNER JOIN "reservation_game" rg ON g."id" = rg."idGame"
            INNER JOIN "reservation" r ON rg."idReservation" = r."idReservation"
            WHERE r."festivalName" = $1
            ORDER BY g."name"
        `;
        const { rows } = await pool.query(query, [festivalName])

        // Map PostgreSQL lowercase column names to camelCase
        const games = rows.map(row => ({
            id: row.id,
            name: row.name,
            author: row.author,
            nbMinPlayer: row.nbminplayer,
            nbMaxPlayer: row.nbmaxplayer,
            gameNotice: row.gamenotice,
            idGameType: row.idgametype,
            minimumAge: row.minimumage,
            prototype: row.prototype,
            duration: row.duration,
            theme: row.theme,
            description: row.description,
            gameImage: row.gameimage,
            rulesTutorial: row.rulestutorial,
            edition: row.edition,
            idEditor: row.ideditor,
            isGamePlaced: row.isgameplaced
        }));

        res.json(games)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer tous les jeux d'une réservation
router.get('/byReservation/:reservationId', verifyToken, async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const query = `
            SELECT g.*, rg."isGamePlaced"
            FROM "game" g
            INNER JOIN "reservation_game" rg ON g."id" = rg."idGame"
            WHERE rg."idReservation" = $1
            ORDER BY g."name"
        `;
        const { rows } = await pool.query(query, [reservationId])

        // Map PostgreSQL lowercase column names to camelCase
        const games = rows.map(row => ({
            id: row.id,
            name: row.name,
            author: row.author,
            nbMinPlayer: row.nbminplayer,
            nbMaxPlayer: row.nbmaxplayer,
            gameNotice: row.gamenotice,
            idGameType: row.idgametype,
            minimumAge: row.minimumage,
            prototype: row.prototype,
            duration: row.duration,
            theme: row.theme,
            description: row.description,
            gameImage: row.gameimage,
            rulesTutorial: row.rulestutorial,
            edition: row.edition,
            idEditor: row.ideditor,
            isGamePlaced: row.isgameplaced
        }));

        res.json(games)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour ajouter un jeu à une réservation
router.post('/add', verifyToken, requireOrganizer, async (req, res) => {
    const { idReservation, idGame, isGamePlaced } = req.body
    if (!idReservation || !idGame) {
        return res.status(400).json({ error: 'ID de réservation et ID de jeu obligatoires' })
    }
    try {
        await pool.query(
            'INSERT INTO "reservation_game" ("idReservation", "idGame", "isGamePlaced") VALUES ($1, $2, $3)',
            [idReservation, idGame, isGamePlaced || false]
        )
        return res.status(201).json({ message: 'Jeu ajouté à la réservation' })
    } catch (err: any) {
        // Catch les erreurs d'unicité (clé primaire composite)
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ce jeu est déjà dans cette réservation' })
        }
        // Catch les erreurs de clé étrangère
        if (err.code === '23503') {
            return res.status(404).json({ error: 'Réservation ou jeu non trouvé' })
        }
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour retirer un jeu d'une réservation
router.delete('/remove/:reservationId/:gameId', verifyToken, requireOrganizer, async (req, res) => {
    const { reservationId, gameId } = req.params
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM "reservation_game" WHERE "idReservation" = $1 AND "idGame" = $2',
            [reservationId, gameId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Association réservation-jeu non trouvée' })
        }
        return res.status(200).json({ message: 'Jeu retiré de la réservation' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour mettre à jour le statut de placement d'un jeu
router.post('/updatePlacement', verifyToken, requireOrganizer, async (req, res) => {
    const { idReservation, idGame, isGamePlaced } = req.body
    if (!idReservation || !idGame || isGamePlaced === undefined) {
        return res.status(400).json({ error: 'ID de réservation, ID de jeu et statut de placement obligatoires' })
    }
    try {
        const { rowCount } = await pool.query(
            'UPDATE "reservation_game" SET "isGamePlaced" = $1 WHERE "idReservation" = $2 AND "idGame" = $3',
            [isGamePlaced, idReservation, idGame]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Association réservation-jeu non trouvée' })
        }
        return res.status(200).json({ message: 'Statut de placement mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router
