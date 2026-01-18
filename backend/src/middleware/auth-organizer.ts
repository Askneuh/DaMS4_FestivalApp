import type { Request, Response, NextFunction } from 'express'

export const requireOrganizer = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
        return res.status(401).json({ error: 'Non authentifié' })
    }

    // Organisateur OU Admin peuvent accéder
    if (user.role === 'organisateur' || user.role === 'admin') {
        return next()
    }

    return res.status(403).json({ error: 'Accès réservé aux organisateurs' })
}
