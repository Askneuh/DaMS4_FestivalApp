import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer un mécanisme par son ID
router.get('/:mechanismId', verifyToken, async (req, res) => {
    const mechanismId = req.params.mechanismId
    try {
        const { rows } = await pool.query('SELECT * FROM mechanism WHERE id = $1', [mechanismId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un mécanisme
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, description } = req.body
    if (!name) {
        return res.status(400).json({ error: "Nom du mécanisme obligatoire pour la création" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO mechanism (name, description) VALUES ($1, $2) RETURNING id',
            [name, description]
        )
        return res.status(201).json({ message: 'Mécanisme créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du mécanisme déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour d'un mécanisme
router.post('/update/:mechanismId', verifyToken, requireAdmin, async (req, res) => {
    const mechanismId = req.params.mechanismId
    const { name, description } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE mechanism SET 
                name = COALESCE($1, name), 
                description = $2 
            WHERE id = $3`,
            [name, description, mechanismId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Mécanisme non trouvé" })
        }
        return res.status(200).json({ message: 'Mécanisme mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router