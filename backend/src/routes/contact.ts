import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer tous les contacts
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, phone, role, "idEditor" FROM contact ORDER BY name'
        );
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer un contact par son ID
router.get('/:contactId', verifyToken, requireAdmin, async (req, res) => {
    const contactId = req.params.contactId
    try {
        const { rows } = await pool.query('SELECT * FROM contact WHERE id = $1', [contactId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un contact
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, email, phone, role, idEditor } = req.body
    if (!name || !email || !idEditor) {
        return res.status(400).json({ error: "Nom, email et ID éditeur obligatoires pour la création de contact" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO contact (name, email, phone, role, idEditor) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, email, phone, role, idEditor]
        )
        return res.status(201).json({ message: 'Contact créé', id: rows[0].id })
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
router.post('/update/:contactId', verifyToken, requireAdmin, async (req, res) => {
    const contactId = req.params.contactId
    const { name, email, phone, role, idEditor } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE contact SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email), 
                phone = $3, 
                role = $4, 
                idEditor = COALESCE($5, idEditor) 
            WHERE id = $6`,
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

// Route pour récupérer tous les contacts d'un éditeur
router.get('/editor/:editorId', verifyToken, requireAdmin, async (req, res) => {
    const editorId = req.params.editorId
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, phone, role, "idEditor" FROM contact WHERE "idEditor" = $1 ORDER BY id',
            [editorId]
        )
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer le contact prioritaire d'un éditeur
router.get('/editor/:editorId/priority', verifyToken, requireAdmin, async (req, res) => {
    const editorId = req.params.editorId
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, phone, role, "idEditor" FROM contact WHERE "idEditor" = $1 AND role = $2',
            [editorId, 'prioritaire']
        )
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Aucun contact prioritaire trouvé pour cet éditeur' })
        }
        res.json(rows[0])
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de suppression d'un contact
router.delete('/:contactId', verifyToken, requireAdmin, async (req, res) => {
    const contactId = req.params.contactId
    try {
        const { rowCount } = await pool.query('DELETE FROM contact WHERE id = $1', [contactId])
        if (rowCount === 0) {
            return res.status(404).json({ error: "Contact non trouvé" })
        }
        return res.status(200).json({ message: 'Contact supprimé' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router