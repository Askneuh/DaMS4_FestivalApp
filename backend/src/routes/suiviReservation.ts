import { Router } from 'express'
import pool from '../db/database.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer l'historique complet des suivis pour une réservation
router.get('/reservation/:reservationId', verifyToken, requireOrganizer, async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const { rows } = await pool.query(
            'SELECT * FROM suivireservation WHERE idreservation = $1 ORDER BY date DESC',
            [reservationId]
        )
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer un suivi de réservation par son ID
router.get('/:suiviId', verifyToken, requireOrganizer, async (req, res) => {
    const suiviId = req.params.suiviId
    try {
        const { rows } = await pool.query('SELECT * FROM suivireservation WHERE id = $1', [suiviId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un suivi de réservation
router.post('/', verifyToken, requireOrganizer, async (req, res) => {
    const { status, idReservation, commentaire } = req.body

    if (!status || !idReservation) {
        return res.status(400).json({ error: "Statut et ID de réservation obligatoires pour la création de suivi" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO suivireservation (status, date, idreservation, commentaire) VALUES ($1, NOW(), $2, $3) RETURNING id',
            [status, idReservation, commentaire]
        )
        return res.status(201).json({ message: 'Suivi de réservation créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du suivi déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour du statut d'un suivi de réservation (met à jour le statut et la date)
// Il est plus logique de créer un NOUVEAU suivi pour refléter un historique, mais si l'objectif est de modifier le DERNIER statut...
router.post('/update/:suiviId', verifyToken, requireOrganizer, async (req, res) => {
    const suiviId = req.params.suiviId
    const { status, commentaire } = req.body
    const dateActuelle: Date = new Date()
    const decalageFuseauHoraire_ms: number = dateActuelle.getTimezoneOffset() * 60 * 1000
    const dateAjustee: Date = new Date(dateActuelle.getTime() - decalageFuseauHoraire_ms)
    const date: string = dateAjustee.toISOString().substring(0, 10)

    if (!status) {
        return res.status(400).json({ error: "Statut obligatoire pour la mise à jour" })
    }

    try {
        const { rowCount } = await pool.query(
            // Mise à jour du statut et de la date (qui sert de date de modification ici)
            'UPDATE suivireservation SET status = $1, date = $2, commentaire = $3 WHERE id = $4',
            [status, date, commentaire, suiviId]
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
router.delete('/:suiviId', verifyToken, requireOrganizer, async (req, res) => {
    const suiviId = req.params.suiviId
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM suivireservation WHERE id = $1',
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
