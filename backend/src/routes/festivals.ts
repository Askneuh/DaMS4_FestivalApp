import { Router } from 'express'
//import pool from '../db/database.ts'
import bcrypt from 'bcryptjs'
//import { requireAdmin } from '../middleware/auth-admin.ts'

import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'

const router = Router()
//Route pour récupérer les données d'un festival dont le nom (unique) est passé en paramètre.
router.post('/:festivalName', async (req,res) => {
    const festivaName = req.params.festivalName;
    const { rows } = await pool.query('SELECT * FROM festival WHERE festivalName = $1', [festivaName])
    res.json(rows)
});
//Route pour cla création d'un festival
router.post('/', async (req, res) => {
    const {festivalName, nbTables, begin_date, end_date} = req.body;
    const dateActuelle: Date = new Date();
    //Gérer le fuseau horaire et formate pour le type Date de postgres
    const decalageFuseauHoraire_ms: number = dateActuelle.getTimezoneOffset() * 60 * 1000;
    const dateAjustee: Date = new Date(dateActuelle.getTime() - decalageFuseauHoraire_ms);
    const creation_date: string = dateAjustee.toISOString().substring(0, 10);
    //On a dit que un super orga peut créer un festival sans rentrer toutes les infos donc on vérifie
    //seulement le nom (clé primaire)
    if (!festivalName) {
        return res.status(400).json({error: "Nom du festival obligatoire pour la création"})
    }
    else {
        try {
            await pool.query(
            'INSERT INTO festival (festivalName, nbTables, creation_date, begin_date, end_date) VALUES ($1, $2, $3, $4, $5)',
            [festivalName, nbTables, creation_date, begin_date, end_date]
            );
            return res.status(201).json({ message: 'Festival créé' })
        }
        catch (err: any) {
            //Catch les erreurs d'unicité, ici de la clé primaire 
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Nom du festival déjà existant' })
            } else {
                console.error(err);
                return res.status(500).json({ error: 'Erreur serveur' })
            }
        }
    }
})

router.post('/update/:festivalName', async (req, res) => {
    const  festivalName = req.params.festivalName;
    const {nbTables, begin_date, end_date} = req.body;
    try {
        await pool.query(
            'UPDATE TABLE festival SET nbTables = $1, begin_date = $2, end_date = $3',
            [nbTables, begin_date, end_date]
            
        )
        return res.status(201).json({ message: 'Festival mis a jour' })
    }
    catch(err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    }
});