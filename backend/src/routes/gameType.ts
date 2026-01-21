import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'
import { validateNumericParam, validateStringLengths } from '../middleware/validation.js'

const router = Router()

// Route pour récupérer tous les types de jeux
router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM "gameType" ORDER BY "gameTypeLabel"');
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer un type de jeu par son ID
router.get('/:gameTypeId', verifyToken, validateNumericParam('gameTypeId'), async (req, res) => {
    const gameTypeId = req.params.gameTypeId
    try {
        const { rows } = await pool.query('SELECT * FROM "gameType" WHERE "id" = $1', [gameTypeId])
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Type de jeu non trouvé' })
        }
        res.json(rows[0])
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un type de jeu
router.post('/', verifyToken, requireAdmin, validateStringLengths({ gameTypeLabel: 255 }), async (req, res) => {
    const { gameTypeLabel, idZone } = req.body
    if (!gameTypeLabel) {
        return res.status(400).json({ error: "Libellé du type de jeu obligatoire pour la création" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO "gameType" ("gameTypeLabel", "idZone") VALUES ($1, $2) RETURNING "id"',
            [gameTypeLabel, idZone]
        )
        return res.status(201).json({ message: 'Type de jeu créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du type de jeu déjà existant' })
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Référence invalide (zone inexistante)' })
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

router.post('/update/:gameTypeId', verifyToken, requireAdmin, validateNumericParam('gameTypeId'), validateStringLengths({ gameTypeLabel: 255 }), async (req, res) => {
    const gameTypeId = req.params.gameTypeId
    const { gameTypeLabel, idZone } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE "gameType" SET 
                "gameTypeLabel" = COALESCE($1, "gameTypeLabel"), 
                "idZone" = COALESCE($2, "idZone") 
            WHERE "id" = $3`,
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

// Route de suppression d'un type de jeu
router.delete('/:gameTypeId', verifyToken, requireAdmin, validateNumericParam('gameTypeId'), async (req, res) => {
    const gameTypeId = req.params.gameTypeId
    try {
        // Vérifier si des jeux utilisent ce type
        const { rows: gamesUsingType } = await pool.query(
            'SELECT COUNT(*) as "count" FROM "game" WHERE "idGameType" = $1',
            [gameTypeId]
        );

        if (parseInt(gamesUsingType[0].count) > 0) {
            return res.status(409).json({
                error: 'Impossible de supprimer ce type de jeu car il est utilisé par des jeux'
            });
        }

        const { rowCount } = await pool.query('DELETE FROM "gameType" WHERE "id" = $1', [gameTypeId])
        if (rowCount === 0) {
            return res.status(404).json({ error: "Type de jeu non trouvé" })
        }
        return res.status(200).json({ message: 'Type de jeu supprimé' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router