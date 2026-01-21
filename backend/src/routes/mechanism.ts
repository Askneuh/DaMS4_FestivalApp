import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'
import { validateNumericParam, validateStringLengths } from '../middleware/validation.js'

const router = Router()

// Route pour récupérer tous les mécanismes
router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM "mechanism" ORDER BY "name"');
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer un mécanisme par son ID
router.get('/:mechanismId', verifyToken, validateNumericParam('mechanismId'), async (req, res) => {
    const mechanismId = req.params.mechanismId
    try {
        const { rows } = await pool.query('SELECT * FROM "mechanism" WHERE "id" = $1', [mechanismId])
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Mécanisme non trouvé' })
        }
        res.json(rows[0])
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un mécanisme
router.post('/', verifyToken, requireAdmin, validateStringLengths({ name: 255, description: 1000 }), async (req, res) => {
    const { name, description } = req.body
    if (!name) {
        return res.status(400).json({ error: "Nom du mécanisme obligatoire pour la création" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO "mechanism" ("name", "description") VALUES ($1, $2) RETURNING "id"',
            [name, description]
        )
        return res.status(201).json({ message: 'Mécanisme créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du mécanisme déjà existant' })
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Référence invalide' })
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de mise à jour d'un mécanisme
router.post('/update/:mechanismId', verifyToken, requireAdmin, validateNumericParam('mechanismId'), validateStringLengths({ name: 255, description: 1000 }), async (req, res) => {
    const mechanismId = req.params.mechanismId
    const { name, description } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE "mechanism" SET 
                "name" = COALESCE($1, "name"), 
                "description" = $2 
            WHERE "id" = $3`,
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

// Route de suppression d'un mécanisme
router.delete('/:mechanismId', verifyToken, requireAdmin, validateNumericParam('mechanismId'), async (req, res) => {
    const mechanismId = req.params.mechanismId
    try {
        // Vérifier si des jeux utilisent ce mécanisme
        const { rows: gamesUsingMechanism } = await pool.query(
            'SELECT COUNT(*) as "count" FROM "game_mechanism" WHERE "idMechanism" = $1',
            [mechanismId]
        );

        if (parseInt(gamesUsingMechanism[0].count) > 0) {
            return res.status(409).json({
                error: 'Impossible de supprimer ce mécanisme car il est utilisé par des jeux'
            });
        }

        const { rowCount } = await pool.query('DELETE FROM "mechanism" WHERE "id" = $1', [mechanismId])
        if (rowCount === 0) {
            return res.status(404).json({ error: "Mécanisme non trouvé" })
        }
        return res.status(200).json({ message: 'Mécanisme supprimé' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router