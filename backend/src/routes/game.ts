import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

router.get('/:gameId', async (req, res) => {
    const gameId = req.params.gameId
    try {
        const { rows } = await pool.query('SELECT * FROM game WHERE idGame = $1', [gameId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'un jeu
router.post('/', requireAdmin, async (req, res) => {
    const { name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype, duration, theme, description, gameImage, rulesTutorial, edition, idEditor } = req.body
    //On suppose que toutes les données sont obligatoires
    if (!name || !author || !idGameType || !idEditor || !nbMinPlayer || !nbMaxPlayer || !minimumAge || !duration) {
        return res.status(400).json({ error: "Informations de jeu obligatoires manquantes" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO game (name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype, duration, theme, description, gameImage, rulesTutorial, edition, idEditor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING idGame',
            [name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype || false, duration, theme, description, gameImage, rulesTutorial, edition, idEditor]
        )
        return res.status(201).json({ message: 'Jeu créé', id: rows[0].idgame })
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
router.post('/update/:gameId', requireAdmin, async (req, res) => {
    const gameId = req.params.gameId
    const { name, author, nbMinPlayer, nbMaxPlayer, gameNotice, idGameType, minimumAge, prototype, duration, theme, description, gameImage, rulesTutorial, edition, idEditor } = req.body
    try {
        const { rowCount } = await pool.query(
            'UPDATE game SET name = $1, author = $2, nbMinPlayer = $3, nbMaxPlayer = $4, gameNotice = $5, idGameType = $6, minimumAge = $7, prototype = $8, duration = $9, theme = $10, description = $11, gameImage = $12, rulesTutorial = $13, edition = $14, idEditor = $15 WHERE idGame = $16',
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

