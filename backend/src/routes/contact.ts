import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer tous les contacts
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT "id", "name", "email", "phone", "role", "idEditor", "priority" FROM "contact" ORDER BY "name"'
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
        const { rows } = await pool.query('SELECT * FROM "contact" WHERE "id" = $1', [contactId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un contact
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, email, phone, role, idEditor, priority } = req.body
    if (!name || !email || !idEditor) {
        return res.status(400).json({ error: "Nom, email et ID éditeur obligatoires pour la création de contact" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO "contact" ("name", "email", "phone", "role", "idEditor", "priority") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id"',
            [name, email, phone, role, idEditor, priority || false]
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
    const { name, email, phone, role, idEditor, priority } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE "contact" SET 
                "name" = COALESCE($1, "name"), 
                "email" = COALESCE($2, "email"), 
                "phone" = $3, 
                "role" = $4, 
                "idEditor" = COALESCE($5, "idEditor"),
                "priority" = COALESCE($6, "priority")
            WHERE "id" = $7`,
            [name, email, phone, role, idEditor, priority, contactId]
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
            'SELECT "id", "name", "email", "phone", "role", "idEditor", "priority" FROM "contact" WHERE "idEditor" = $1 ORDER BY "id"',
            [editorId]
        )
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})



// Route de suppression d'un contact
router.delete('/:contactId', verifyToken, requireAdmin, async (req, res) => {
    const contactId = req.params.contactId
    try {
        const { rowCount } = await pool.query('DELETE FROM "contact" WHERE "id" = $1', [contactId])
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