import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

// Route pour récupérer une zone tarifaire par son ID
router.get('/:tzId', async (req, res) => {
    const tzId = req.params.tzId
    try {
        const { rows } = await pool.query('SELECT * FROM tariffZone WHERE idTZ = $1', [tzId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une zone tarifaire
router.post('/', requireAdmin, async (req, res) => {
    const { name, nbTables, tablePrice, squareMeterPrice, festivalName } = req.body
    if (!festivalName) {
        return res.status(400).json({ error: "Nom du festival obligatoire pour la création de zone tarifaire" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO tariffZone (name, nbTables, tablePrice, squareMeterPrice, festivalName) VALUES ($1, $2, $3, $4, $5) RETURNING idTZ',
            [name, nbTables, tablePrice, squareMeterPrice, festivalName]
        )
        return res.status(201).json({ message: 'Zone tarifaire créée', id: rows[0].idtz })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de la zone tariffaire déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Route de mise à jour d'une zone tarifaire
router.post('/update/:tzId', requireAdmin, async (req, res) => {
    const tzId = req.params.tzId
    const { name, nbTables, tablePrice, squareMeterPrice } = req.body
    try {
        const { rowCount } = await pool.query(
            'UPDATE tariffZone SET name = $1, nbTables = $2, tablePrice = $3, squareMeterPrice = $4 WHERE idTZ = $5',
            [name, nbTables, tablePrice, squareMeterPrice, tzId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Zone tarifaire non trouvée" })
        }
        return res.status(200).json({ message: 'Zone tarifaire mise à jour' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

//Route de récupéeration de toutes les zones tarifaires d'un festival
router.get('/festival/:festivalName', async (req, res) => {
    const festivalName = req.params.festivalName;
    try {
        const { rows } = await pool.query('SELECT * FROM tariffZone WHERE festivalName = $1', [festivalName]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Aucune zone tarifaire trouvée pour ce festival" });
        }
        res.json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router