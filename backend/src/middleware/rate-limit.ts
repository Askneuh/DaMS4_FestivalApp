import rateLimit from 'express-rate-limit'

/**
 * Rate limiter pour les routes d'authentification (login, register)
 * Limite: 5 tentatives par 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requêtes max
    message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
    standardHeaders: true, // Retourne les headers RateLimit-*
    legacyHeaders: false, // Désactive les headers X-RateLimit-*
})

/**
 * Rate limiter pour les routes de création/modification
 * Limite: 30 requêtes par minute
 */
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requêtes max
    message: { error: 'Trop de requêtes. Ralentissez un peu.' },
    standardHeaders: true,
    legacyHeaders: false,
})

/**
 * Rate limiter strict pour les routes de suppression
 * Limite: 10 requêtes par minute
 */
export const deleteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requêtes max
    message: { error: 'Trop de suppressions. Ralentissez.' },
    standardHeaders: true,
    legacyHeaders: false,
})
