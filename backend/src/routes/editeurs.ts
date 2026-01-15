import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()

router.get('/:editorId', async (req, res) => {
    const idE = req.params.editorId
    try {
        const { rows } = await pool.query('SELECT * FROM editor WHERE "id" = $1', [idE])

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Éditeur non trouvé' });
        }

        const row = rows[0];

        // Map PostgreSQL lowercase column names to camelCase
        const editor = {
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo
        };

        res.json(editor)
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
            'INSERT INTO editor (name, exposant, distributeur, logo) VALUES ($1, $2, $3, $4) RETURNING "id"',
            [name, exposant || false, distributeur || false, logo]
        )
        return res.status(201).json(rows[0]);
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
        // Utilisation de COALESCE pour garder l'ancienne valeur si la nouvelle est undefined/null
        const { rows, rowCount } = await pool.query(
            `UPDATE editor 
             SET name = COALESCE($1, name), 
                 exposant = COALESCE($2, exposant), 
                 distributeur = COALESCE($3, distributeur), 
                 logo = COALESCE($4, logo) 
             WHERE "id" = $5 
             RETURNING *`,
            [name, exposant, distributeur, logo, editeurId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: "Éditeur non trouvé" });
        }

        // On renvoie l'objet complet mis à jour
        return res.status(200).json(rows[0]);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router