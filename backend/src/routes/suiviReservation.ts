import { Router } from 'express'
import pool from '../db/database.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'
import { getCurrentDateTime } from '../utils/date.js'
import { validateNumericParam, validateStringLengths } from '../middleware/validation.js'

const router = Router()

// Route pour récupérer l'historique complet des suivis pour une réservation
router.get('/reservation/:reservationId', verifyToken, requireOrganizer, validateNumericParam('reservationId'), async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const { rows } = await pool.query(
            'SELECT * FROM "suiviReservation" WHERE "idReservation" = $1 ORDER BY "date" DESC',
            [reservationId]
        )
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer un suivi de réservation par son ID
router.get('/:suiviId', verifyToken, requireOrganizer, validateNumericParam('suiviId'), async (req, res) => {
    const suiviId = req.params.suiviId
    try {
        const { rows } = await pool.query('SELECT * FROM "suiviReservation" WHERE "id" = $1', [suiviId])
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Suivi de réservation non trouvé' })
        }
        res.json(rows[0])
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un suivi de réservation
router.post('/', verifyToken, requireOrganizer, validateStringLengths({ status: 255 }), async (req, res) => {
    const { status, idReservation, commentaire } = req.body

    if (!status || !idReservation) {
        return res.status(400).json({ error: "Statut et ID de réservation obligatoires pour la création de suivi" })
    }
    if (typeof idReservation !== 'number' || idReservation < 1) {
        return res.status(400).json({ error: "ID de réservation invalide" })
    }

    const modification_date = getCurrentDateTime()
    try {
        const { rows } = await pool.query(
            'INSERT INTO "suiviReservation" ("status", "date", "idReservation", "commentaire") VALUES ($1, $2, $3, $4) RETURNING "id"',
            [status, modification_date, idReservation, commentaire]
        )
        // Note: La modification_date est enregistrée automatiquement à l'instant de la création
        return res.status(201).json({ message: 'Suivi de réservation créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du suivi déjà existant' })
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Réservation inexistante' })
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de mise à jour du statut d'un suivi de réservation (met à jour le statut et la date)
// Il est plus logique de créer un NOUVEAU suivi pour refléter un historique, mais si l'objectif est de modifier le DERNIER statut...
router.post('/update/:suiviId', verifyToken, requireOrganizer, validateNumericParam('suiviId'), validateStringLengths({ status: 255 }), async (req, res) => {
    const suiviId = req.params.suiviId
    const { status } = req.body
    const modification_date = getCurrentDateTime()

    if (!status) {
        return res.status(400).json({ error: "Statut obligatoire pour la mise à jour" })
    }

    try {
        const { rowCount } = await pool.query(
            // Mise à jour du statut et de la date de modification
            'UPDATE "suiviReservation" SET "status" = $1, "date" = $2 WHERE "id" = $3',
            [status, modification_date, suiviId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Suivi non trouvé" })
        }
        return res.status(200).json({ message: 'Suivi de réservation mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de suppression d'un suivi de réservation
router.delete('/:suiviId', verifyToken, requireOrganizer, validateNumericParam('suiviId'), async (req, res) => {
    const suiviId = req.params.suiviId
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM "suiviReservation" WHERE "id" = $1',
            [suiviId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Suivi non trouvé" })
        }
        return res.status(200).json({ message: 'Suivi supprimé' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router
