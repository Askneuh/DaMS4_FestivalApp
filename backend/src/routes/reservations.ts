import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

router.get('/:reservationId', requireAdmin, async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const { rows } = await pool.query('SELECT * FROM reservation WHERE idReservation = $1', [reservationId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une réservation
router.post('/', requireAdmin, async (req, res) => {
    const { idEditor, nbTables, price, remise } = req.body
    if (!idEditor) {
        return res.status(400).json({ error: "ID de l'éditeur obligatoire pour la création de réservation" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO reservation (idEditor, nbTables, price, remise) VALUES ($1, $2, $3, $4) RETURNING idReservation',
            [idEditor, nbTables, price, remise]
        )
        return res.status(201).json({ message: 'Réservation créée', id: rows[0].idreservation })
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
    const { nbTables, price, remise } = req.body
    try {
        const { rowCount } = await pool.query(
            'UPDATE reservation SET nbTables = $1, price = $2, remise = $3 WHERE idReservation = $4',
            [nbTables, price, remise, reservationId]
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

export default router