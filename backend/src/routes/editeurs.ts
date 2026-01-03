import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

router.get('/:editorId', async (req, res) => {
    const idE = req.params.editorId
    try {
        const { rows } = await pool.query('SELECT * FROM editor WHERE idEditor = $1', [idE])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un editeur
router.post('/', async (req, res) => {
    const { name, exposant, distributeur, logo } = req.body
    if (!name) {
        return res.status(400).json({ error: "Nom de l'éditeur obligatoire pour la création" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO editor (name, exposant, distributeur, logo) VALUES ($1, $2, $3, $4) RETURNING idEditor',
            [name, exposant || false, distributeur || false, logo]
        )
        return res.status(201).json({ message: 'Éditeur créé'})
    } 
    catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de l\'éditeur déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

router.post('/update/:editorId', async (req, res) => {
    const editeurId = req.params.editorId;
    const { name, exposant, distributeur, logo } = req.body;
    try {
        const { rowCount } = await pool.query(
            'UPDATE editor SET name = $1, exposant = $2, distributeur = $3, logo = $4 WHERE idEditor = $5',
            [name, exposant, distributeur, logo, editeurId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Éditeur non trouvé" })
        }
        return res.status(200).json({ message: 'Éditeur mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})
