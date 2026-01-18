import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer une zone de plan par son ID
router.get('/:planAreaId', verifyToken, async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const { rows } = await pool.query('SELECT * FROM planArea WHERE id = $1', [planAreaId])
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une zone de plan
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, festivalName, idTZ } = req.body

    if (!name || !festivalName) {
        return res.status(400).json({ error: "Nom et nom du festival obligatoires pour la création de zone de plan" })
    }

    try {
        const smallTables = nbSmallTables || 0;
        const largeTables = nbLargeTables || 0;
        const cityHallTables = nbCityHallTables || 0;

        const { rows } = await pool.query(
            'INSERT INTO planArea (name, "nbSmallTables", "nbLargeTables", "nbCityHallTables", festivalName, "idTZ") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, smallTables, largeTables, cityHallTables, festivalName, idTZ || null]
        )
        return res.status(201).json({ message: 'Zone de plan créée', id: rows[0].id })
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
router.post('/update/:planAreaId', verifyToken, requireAdmin, async (req, res) => {
    const planAreaId = req.params.planAreaId
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, festivalName, idTZ } = req.body
    try {
        const { rowCount } = await pool.query(
            `UPDATE planArea SET 
                name = COALESCE($1, name), 
                "nbSmallTables" = COALESCE($2, "nbSmallTables"), 
                "nbLargeTables" = COALESCE($3, "nbLargeTables"), 
                "nbCityHallTables" = COALESCE($4, "nbCityHallTables"), 
                festivalName = COALESCE($5, festivalName),
                "idTZ" = $6
            WHERE id = $7`,
            [name, nbSmallTables, nbLargeTables, nbCityHallTables, festivalName, idTZ, planAreaId]
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

// Route pour récupérer toutes les zones de plan d'un festival
router.get('/festival/:festivalName', verifyToken, async (req, res) => {
    const festivalName = req.params.festivalName
    try {
        const { rows } = await pool.query(
            'SELECT * FROM planArea WHERE festivalName = $1 ORDER BY name',
            [festivalName]
        )
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de suppression d'une zone de plan
router.delete('/:planAreaId', verifyToken, requireAdmin, async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        // Vérifier si des jeux ou éditeurs sont associés à cette zone
        const { rows: gamesInArea } = await pool.query(
            'SELECT COUNT(*) as count FROM game_planArea WHERE idPA = $1',
            [planAreaId]
        )
        const { rows: editorsInArea } = await pool.query(
            'SELECT COUNT(*) as count FROM editor_planArea WHERE idPA = $1',
            [planAreaId]
        )

        if (parseInt(gamesInArea[0].count) > 0 || parseInt(editorsInArea[0].count) > 0) {
            return res.status(409).json({
                error: 'Impossible de supprimer cette zone car elle contient des jeux ou des éditeurs'
            })
        }

        const { rowCount } = await pool.query('DELETE FROM planArea WHERE id = $1', [planAreaId])
        if (rowCount === 0) {
            return res.status(404).json({ error: "Zone de plan non trouvée" })
        }
        return res.status(200).json({ message: 'Zone de plan supprimée' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router