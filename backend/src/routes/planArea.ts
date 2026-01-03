import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

// Route pour récupérer une zone de plan par son ID
router.get('/:planAreaId', async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const { rows } = await pool.query('SELECT * FROM planArea WHERE idPA = $1', [planAreaId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une zone de plan
router.post('/', requireAdmin, async (req, res) => {
    const { name, nbTables, festivalName } = req.body
    if (!name || !nbTables || !festivalName) {
        return res.status(400).json({ error: "Nom, nombre de tables et nom du festival obligatoires pour la création de zone de plan" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO planArea (name, nbTables, festivalName) VALUES ($1, $2, $3) RETURNING idPA',
            [name, nbTables, festivalName]
        )
        return res.status(201).json({ message: 'Zone de plan créée', id: rows[0].idpa })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de la zone du plan déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour d'une zone de plan
router.post('/update/:planAreaId', requireAdmin, async (req, res) => {
    const planAreaId = req.params.planAreaId
    const { name, nbTables, festivalName } = req.body
    try {
        const { rowCount } = await pool.query(
            'UPDATE planArea SET name = $1, nbTables = $2, festivalName = $3 WHERE idPA = $4',
            [name, nbTables, festivalName, planAreaId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Zone de plan non trouvée" })
        }
        return res.status(200).json({ message: 'Zone de plan mise à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

