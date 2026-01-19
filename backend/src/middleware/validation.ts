import type { Request, Response, NextFunction } from 'express'

/**
 * Middleware pour valider qu'un paramètre d'URL est un nombre entier positif valide
 */
export function validateNumericParam(paramName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const value = req.params[paramName]

        // Vérifier que le paramètre existe
        if (!value) {
            return res.status(400).json({
                error: `Paramètre '${paramName}' manquant.`
            })
        }

        const numValue = parseInt(value, 10)

        if (isNaN(numValue) || numValue <= 0 || value !== numValue.toString()) {
            return res.status(400).json({
                error: `Paramètre '${paramName}' invalide. Doit être un entier positif.`
            })
        }

        // Remplacer la valeur string par le nombre validé
        (req.params as any)[paramName] = numValue
        next()
    }
}

/**
 * Middleware pour valider la longueur des chaînes de caractères dans le body
 */
export function validateStringLengths(limits: Record<string, number>) {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const [field, maxLength] of Object.entries(limits)) {
            const value = req.body[field]

            if (value !== undefined && value !== null) {
                if (typeof value !== 'string') {
                    return res.status(400).json({
                        error: `Le champ '${field}' doit être une chaîne de caractères`
                    })
                }

                if (value.length > maxLength) {
                    return res.status(400).json({
                        error: `Le champ '${field}' dépasse la longueur maximale de ${maxLength} caractères`
                    })
                }
            }
        }
        next()
    }
}

/**
 * Middleware pour normaliser les valeurs booléennes dans le body
 */
export function normalizeBooleans(fields: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const field of fields) {
            const value = req.body[field]

            if (value !== undefined && value !== null) {
                // Convertir les strings "true"/"false" en booléens
                if (value === 'true' || value === true) {
                    req.body[field] = true
                } else if (value === 'false' || value === false) {
                    req.body[field] = false
                } else if (value !== true && value !== false) {
                    return res.status(400).json({
                        error: `Le champ '${field}' doit être un booléen (true/false)`
                    })
                }
            }
        }
        next()
    }
}

/**
 * Middleware pour masquer les détails d'erreur en production
 */
export function handleError(err: any, req: Request, res: Response, next: NextFunction) {
    console.error('Erreur:', err)

    // En production, ne jamais exposer les détails
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Erreur serveur' })
    }

    // En développement, montrer plus de détails
    return res.status(500).json({
        error: 'Erreur serveur',
        message: err.message,
        stack: err.stack
    })
}
