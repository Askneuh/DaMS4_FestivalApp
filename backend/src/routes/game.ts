import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer tous les jeux
router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM game ORDER BY name');
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer les jeux d'un éditeur
// IMPORTANT: Routes spécifiques AVANT la route générique /:gameId
router.get('/byEditor/:idEditor', verifyToken, async (req, res) => {
    const idEditor = req.params.idEditor
    try {
        const { rows } = await pool.query('SELECT * FROM game WHERE "idEditor" = $1', [idEditor])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer les jeux qu'un éditeur N'A PAS
router.get('/notByEditor/:idEditor', verifyToken, async (req, res) => {
    const idEditor = req.params.idEditor;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM game WHERE "idEditor" != $1 ORDER BY name',
            [idEditor]
        );
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer le libellé du type de jeu
router.get('/gameType/:idGameType/label', verifyToken, async (req, res) => {
    const idGameType = req.params.idGameType;
    try {
        const { rows } = await pool.query(
            'SELECT "gameTypeLabel" FROM gameType WHERE id = $1',
            [idGameType]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Type de jeu non trouvé' });
        }
        res.json({ gameTypeLabel: rows[0].gameTypeLabel });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer les mécanismes d'un jeu
// IMPORTANT: Cette route doit être AVANT /:gameId
router.get('/:gameId/mechanisms', verifyToken, async (req, res) => {
    const gameId = req.params.gameId;
    try {
        const { rows } = await pool.query(
            `SELECT m.* FROM mechanism m
             INNER JOIN game_mechanism gm ON m.id = gm."idMechanism"
             WHERE gm."idGame" = $1`,
            [gameId]
        );
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer un jeu par son ID
// IMPORTANT: Cette route générique doit être APRÈS les routes spécifiques
router.get('/:gameId', verifyToken, async (req, res) => {
    const gameId = req.params.gameId
    try {
        const { rows } = await pool.query('SELECT * FROM game WHERE "id" = $1', [gameId])
        if (rows.length === 0) {
            return res.status(404).json({ error: "Jeu non trouvé" });
        }
        res.json(rows[0])
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un jeu
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype, duration, theme, description, gameImage, rulesTutorial, edition, idEditor } = req.body
    //On suppose que toutes les données sont obligatoires
    if (!name || !author || !idGameType || !idEditor || !nbMinPlayer || !nbMaxPlayer || !minimumAge || !duration) {
        return res.status(400).json({ error: "Informations de jeu obligatoires manquantes" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO game ("name", "author", "nbMinPlayer", "nbMaxPlayer", "gameNotice", "idGameType", "minimumAge", "prototype", "duration", "theme", "description", "gameImage", "rulesTutorial", "edition", "idEditor") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING "id"',
            [name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype || false, duration, theme, description, gameImage, rulesTutorial, edition, idEditor]
        )
        return res.status(201).json({ message: 'Jeu créé', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id du jeu déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour d'un jeu
router.post('/update/:gameId', verifyToken, requireAdmin, async (req, res) => {
    const gameId = req.params.gameId
    const { name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype, duration, theme, description, gameImage, rulesTutorial, edition, idEditor } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE game SET 
                "name" = COALESCE($1, "name"), 
                "author" = COALESCE($2, "author"), 
                "nbMinPlayer" = COALESCE($3, "nbMinPlayer"), 
                "nbMaxPlayer" = COALESCE($4, "nbMaxPlayer"), 
                "gameNotice" = $5, 
                "idGameType" = COALESCE($6, "idGameType"), 
                "minimumAge" = COALESCE($7, "minimumAge"), 
                "prototype" = COALESCE($8, "prototype"), 
                "duration" = COALESCE($9, "duration"), 
                "theme" = $10, 
                "description" = $11, 
                "gameImage" = $12, 
                "rulesTutorial" = $13, 
                "edition" = $14, 
                "idEditor" = COALESCE($15, "idEditor") 
            WHERE "id" = $16`,
            [name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype, duration, theme, description, gameImage, rulesTutorial, edition, idEditor, gameId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Jeu non trouvé" })
        }
        return res.status(200).json({ message: 'Jeu mis à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de suppression d'un jeu
router.delete('/:gameId', verifyToken, requireAdmin, async (req, res) => {
    const gameId = req.params.gameId
    try {
        const { rowCount } = await pool.query('DELETE FROM game WHERE "id" = $1', [gameId])
        if (rowCount === 0) {
            return res.status(404).json({ error: "Jeu non trouvé" })
        }
        return res.status(200).json({ message: 'Jeu supprimé' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router