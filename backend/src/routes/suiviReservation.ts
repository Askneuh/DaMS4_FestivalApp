import { Router } from 'express'
import pool from '../db/database.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer un suivi de réservation par son ID
router.get('/:suiviId', verifyToken, requireOrganizer, async (req, res) => {
    const suiviId = req.params.suiviId
    try {
        const { rows } = await pool.query('SELECT * FROM suiviReservation WHERE idSuivi = $1', [suiviId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un suivi de réservation
router.post('/', verifyToken, requireOrganizer, async (req, res) => {
    const { status, idReservation } = req.body
    const dateActuelle: Date = new Date()
    // Gestion du fuseau horaire
    const decalageFuseauHoraire_ms: number = dateActuelle.getTimezoneOffset() * 60 * 1000
    const dateAjustee: Date = new Date(dateActuelle.getTime() - decalageFuseauHoraire_ms)
    const modification_date: string = dateAjustee.toISOString().substring(0, 10)

    if (!status || !idReservation) {
        return res.status(400).json({ error: "Statut et ID de réservation obligatoires pour la création de suivi" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO suiviReservation (status, modification_date, idReservation) VALUES ($1, $2, $3) RETURNING idSuivi',
            [status, modification_date, idReservation]
        )
        // Note: La modification_date est enregistrée automatiquement à l'instant de la création
        return res.status(201).json({ message: 'Suivi de réservation créé', id: rows[0].idsuivi })
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
    const { status } = req.body
    const dateActuelle: Date = new Date()
    const decalageFuseauHoraire_ms: number = dateActuelle.getTimezoneOffset() * 60 * 1000
    const dateAjustee: Date = new Date(dateActuelle.getTime() - decalageFuseauHoraire_ms)
    const modification_date: string = dateAjustee.toISOString().substring(0, 10)

    if (!status) {
        return res.status(400).json({ error: "Statut obligatoire pour la mise à jour" })
    }

    try {
        const { rowCount } = await pool.query(
            // Mise à jour du statut et de la date de modification
            'UPDATE suiviReservation SET status = $1, modification_date = $2 WHERE idSuivi = $3',
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

export default router