import { Router } from 'express'
//import pool from '../db/database.ts'
import bcrypt from 'bcryptjs'
//import { requireAdmin } from '../middleware/auth-admin.ts'

import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()


router.get('/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId
    console.log("userid", userId)
    try {
        const { rows } = await pool.query('SELECT id, login, role FROM users WHERE id = $1', [userId])
        res.json(rows)
    }
    catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})
// Création d'un utilisateur
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    const { login, password, role } = req.body
    if (!login || !password) {
        return res.status(400).json({ error: 'Login et mot de passe requis' })
    }

    // Validate role if provided
    const validRoles = ['visiteur', 'editeur_jeu', 'organisateur', 'admin']
    const userRole = role && validRoles.includes(role) ? role : 'visiteur'

    try {
        console.log('Body reçu :', req.body);
        const hash = await bcrypt.hash(password, 10)
        await pool.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3)',
            [login, hash, userRole]
        );
        return res.status(201).json({ message: 'Utilisateur créé', role: userRole })
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Login déjà existant' })
        } else {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' })
        }
    }
})

// Mise à jour du rôle d'un utilisateur (admin uniquement)
router.put('/:userId/role', verifyToken, requireAdmin, async (req, res) => {
    const userId = req.params.userId
    const { role } = req.body

    if (!role) {
        return res.status(400).json({ error: 'Rôle requis' })
    }

    const validRoles = ['visiteur', 'editeur_jeu', 'organisateur', 'admin']
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide. Rôles valides: ' + validRoles.join(', ') })
    }

    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, login, role',
            [role, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        return res.json({ message: 'Rôle mis à jour', user: result.rows[0] })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Suppression d'un utilisateur (admin uniquement)
router.delete('/:userId', verifyToken, requireAdmin, async (req, res) => {
    const userId = req.params.userId

    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, login',
            [userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        return res.json({ message: 'Utilisateur supprimé', user: result.rows[0] })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Récupération du profil utilisateur (authentifié)
router.get('/me', verifyToken, async (req, res) => {
    const user = req.user
    const { rows } = await pool.query('SELECT id, login, role FROM users WHERE id=$1', [user?.id])
    res.json(rows[0]);
})


// Liste de tous les utilisateurs (réservée aux admins)
router.get('/', verifyToken, requireAdmin, async (_req, res) => {
    const { rows } = await pool.query('SELECT id, login, role FROM users ORDER BY id')
    res.json(rows)
})

export default router