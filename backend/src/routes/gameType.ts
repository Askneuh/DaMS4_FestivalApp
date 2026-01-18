import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer un type de jeu par son ID
router.get('/:gameTypeId', verifyToken, async (req, res) => {
    const gameTypeId = req.params.gameTypeId
    try {
        const { rows } = await pool.query('SELECT * FROM gameType WHERE id = $1', [gameTypeId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un type de jeu
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { gameTypeLabel, idZone } = req.body
    if (!gameTypeLabel) {
        return res.status(400).json({ error: "Libellé du type de jeu obligatoire pour la création" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO gameType (gameTypeLabel, idZone) VALUES ($1, $2) RETURNING id',
            [gameTypeLabel, idZone]
        )
        return res.status(201).json({ message: 'Type de jeu créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du type de jeu déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

router.post('/update/:gameTypeId', verifyToken, requireAdmin, async (req, res) => {
    const gameTypeId = req.params.gameTypeId
    const { gameTypeLabel, idZone } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE gameType SET 
                gameTypeLabel = COALESCE($1, gameTypeLabel), 
                idZone = COALESCE($2, idZone) 
            WHERE id = $3`,
            [gameTypeLabel, idZone, gameTypeId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Type de jeu non trouvé" })
        }
        return res.status(200).json({ message: 'Type de jeu mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router