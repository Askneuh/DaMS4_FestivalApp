import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

// Route pour récupérer un contact par son ID
router.get('/:contactId', requireAdmin, async (req, res) => {
    const contactId = req.params.contactId
    try {
        const { rows } = await pool.query('SELECT * FROM contact WHERE idContact = $1', [contactId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un contact
router.post('/', requireAdmin, async (req, res) => {
    const { name, email, phone, role, idEditor } = req.body
    if (!name || !email || !idEditor) {
        return res.status(400).json({ error: "Nom, email et ID éditeur obligatoires pour la création de contact" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO contact (name, email, phone, role, idEditor) VALUES ($1, $2, $3, $4, $5) RETURNING idContact',
            [name, email, phone, role, idEditor]
        )
        return res.status(201).json({ message: 'Contact créé', id: rows[0].idcontact })
    } catch (err: any) {
            //Catch les erreurs d'unicité, ici de la clé primaire 
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Id du contact déjà existant' })
            } else {
                console.error(err);
                return res.status(500).json({ error: 'Erreur serveur' })
            }
        }
})

// Route de mise à jour d'un contact
router.post('/update/:contactId', requireAdmin, async (req, res) => {
    const contactId = req.params.contactId
    const { name, email, phone, role, idEditor } = req.body
    try {
        const { rowCount } = await pool.query(
            'UPDATE contact SET name = $1, email = $2, phone = $3, role = $4, idEditor = $5 WHERE idContact = $6',
            [name, email, phone, role, idEditor, contactId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Contact non trouvé" })
        }
        return res.status(200).json({ message: 'Contact mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

