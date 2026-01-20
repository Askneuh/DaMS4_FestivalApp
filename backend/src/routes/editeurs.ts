import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'
import { validateNumericParam, validateStringLengths, normalizeBooleans } from '../middleware/validation.js'

const router = Router()

// Route pour récupérer tous les éditeurs
router.get('/', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM "editor" ORDER BY "name"');

        // Map PostgreSQL lowercase column names to camelCase
        const editors = rows.map(row => ({
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo
        }));

        res.json(editors);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer tous les éditeurs avec leur statut de réservation pour le FESTIVAL COURANT
// IMPORTANT: Cette route doit être AVANT /festival/:festivalName pour éviter les conflits
router.get('/current-festival/withReservationStatus', verifyToken, async (req, res) => {
    try {
        // Récupérer le festival courant
        const { rows: festivalRows } = await pool.query(
            'SELECT "name" FROM "festival" WHERE "isCurrent" = TRUE'
        );

        if (festivalRows.length === 0) {
            return res.status(404).json({ error: 'Aucun festival courant défini' });
        }

        const festivalName = festivalRows[0].name;

        // Réutiliser la même logique que la route /festival/:festivalName/withReservationStatus
        const query = `
            SELECT 
                e."id",
                e."name",
                e."exposant",
                e."distributeur",
                e."logo",
                -- Informations de réservation
                r."idReservation",
                r."status" as "reservationStatus",
                r."nbSmallTables",
                r."nbLargeTables",
                r."nbCityHallTables",
                r."remise",
                -- Calcul du prix total
                COALESCE(
                    (SELECT 
                        (COALESCE(r."nbSmallTables", 0) * COALESCE(tz."smallTablePrice", 0) +
                         COALESCE(r."nbLargeTables", 0) * COALESCE(tz."largeTablePrice", 0) +
                         COALESCE(r."nbCityHallTables", 0) * COALESCE(tz."cityHallTablePrice", 0)) - 
                        COALESCE(r."remise", 0)
                    FROM "tariffZone" tz
                    WHERE tz."idTZ" = r."idTZ"),
                    0
                ) as "totalPrice",
                -- Dernière date de contact (du suivi de réservation le plus récent)
                (SELECT MAX(sr."date") 
                 FROM "suiviReservation" sr 
                 WHERE sr."idReservation" = r."idReservation") as "lastContactDate",
                -- Contact prioritaire
                c."id" as "contactId",
                c."name" as "contactName",
                c."email" as "contactEmail",
                c."phone" as "contactPhone"
            FROM "editor" e
            LEFT JOIN "reservation" r ON e."id" = r."idEditor" AND r."festivalName" = $1
            LEFT JOIN "contact" c ON e."id" = c."idEditor" AND c."role" = 'prioritaire'
            ORDER BY e."name"
        `;

        const { rows } = await pool.query(query, [festivalName]);

        const editors = rows.map(row => ({
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo,
            reservation: row.idReservation ? {
                idReservation: row.idReservation,
                status: row.reservationStatus,
                nbSmallTables: row.nbSmallTables,
                nbLargeTables: row.nbLargeTables,
                nbCityHallTables: row.nbCityHallTables,
                remise: parseFloat(row.remise) || 0,
                totalPrice: parseFloat(row.totalPrice) || 0,
                lastContactDate: row.lastContactDate
            } : null,
            contact: row.contactId ? {
                id: row.contactId,
                name: row.contactName,
                email: row.contactEmail,
                phone: row.contactPhone
            } : null,
            // Indicateurs dérivés pour faciliter le tri/filtrage côté frontend
            hasReservation: !!row.idReservation,
            hasBeenContacted: !!row.lastContactDate
        }));

        res.json(editors);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer tous les éditeurs avec leur statut de réservation pour un festival
// IMPORTANT: Cette route doit être AVANT /:editorId pour éviter les conflits
router.get('/festival/:festivalName/withReservationStatus', verifyToken, async (req, res) => {
    const festivalName = req.params.festivalName;
    try {
        const query = `
            SELECT 
                e."id",
                e."name",
                e."exposant",
                e."distributeur",
                e."logo",
                -- Informations de réservation
                r."idReservation",
                r."status" as "reservationStatus",
                r."nbSmallTables",
                r."nbLargeTables",
                r."nbCityHallTables",
                r."remise",
                -- Calcul du prix total
                COALESCE(
                    (SELECT 
                        (COALESCE(r."nbSmallTables", 0) * COALESCE(tz."smallTablePrice", 0) +
                         COALESCE(r."nbLargeTables", 0) * COALESCE(tz."largeTablePrice", 0) +
                         COALESCE(r."nbCityHallTables", 0) * COALESCE(tz."cityHallTablePrice", 0)) - 
                        COALESCE(r."remise", 0)
                    FROM "tariffZone" tz
                    WHERE tz."idTZ" = r."idTZ"),
                    0
                ) as "totalPrice",
                -- Dernière date de contact (du suivi de réservation le plus récent)
                (SELECT MAX(sr."date") 
                 FROM "suiviReservation" sr 
                 WHERE sr."idReservation" = r."idReservation") as "lastContactDate",
                -- Contact prioritaire
                c."id" as "contactId",
                c."name" as "contactName",
                c."email" as "contactEmail",
                c."phone" as "contactPhone"
            FROM "editor" e
            LEFT JOIN "reservation" r ON e."id" = r."idEditor" AND r."festivalName" = $1
            LEFT JOIN "contact" c ON e."id" = c."idEditor" AND c."role" = 'prioritaire'
            ORDER BY e."name"
        `;

        const { rows } = await pool.query(query, [festivalName]);

        const editors = rows.map(row => ({
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo,
            reservation: row.idReservation ? {
                idReservation: row.idReservation,
                status: row.reservationStatus,
                nbSmallTables: row.nbSmallTables,
                nbLargeTables: row.nbLargeTables,
                nbCityHallTables: row.nbCityHallTables,
                remise: parseFloat(row.remise) || 0,
                totalPrice: parseFloat(row.totalPrice) || 0,
                lastContactDate: row.lastContactDate
            } : null,
            contact: row.contactId ? {
                id: row.contactId,
                name: row.contactName,
                email: row.contactEmail,
                phone: row.contactPhone
            } : null,
            // Indicateurs dérivés pour faciliter le tri/filtrage côté frontend
            hasReservation: !!row.idReservation,
            hasBeenContacted: !!row.lastContactDate
        }));

        res.json(editors);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer un éditeur par son ID
router.get('/:editorId', verifyToken, validateNumericParam('editorId'), async (req, res) => {
    const idE = req.params.editorId
    try {
        const { rows } = await pool.query('SELECT * FROM "editor" WHERE "id" = $1', [idE])

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
router.post('/', verifyToken, requireAdmin, validateStringLengths({ name: 255, logo: 500 }), normalizeBooleans(['exposant', 'distributeur']), async (req, res) => {
    const { name, exposant, distributeur, logo } = req.body
    if (!name) {
        return res.status(400).json({ error: "Nom de l'éditeur obligatoire pour la création" })
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO "editor" ("name", "exposant", "distributeur", "logo") VALUES ($1, $2, $3, $4) RETURNING "id"',
            [name, exposant || false, distributeur || false, logo]
        )
        return res.status(201).json({ message: 'Éditeur créé', id: rows[0].id });
    }
    catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de l\'éditeur déjà existant' })
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Référence invalide' })
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

router.post('/update/:editorId', verifyToken, requireAdmin, validateNumericParam('editorId'), validateStringLengths({ name: 255, logo: 500 }), normalizeBooleans(['exposant', 'distributeur']), async (req, res) => {
    const editeurId = req.params.editorId;
    const { name, exposant, distributeur, logo } = req.body;

    try {
        // Utilisation de COALESCE pour les champs requis, pas pour logo (nullable)
        const { rows, rowCount } = await pool.query(
            `UPDATE "editor" 
             SET "name" = COALESCE($1, "name"), 
                 "exposant" = COALESCE($2, "exposant"), 
                 "distributeur" = COALESCE($3, "distributeur"), 
                 "logo" = $4 
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

// Route pour récupérer tous les éditeurs d'un festival
router.get('/festival/:festivalName', verifyToken, async (req, res) => {
    const festivalName = req.params.festivalName;
    try {
        const { rows } = await pool.query(
            `SELECT e."id", e."name", e."exposant", e."distributeur", e."logo" 
             FROM "editor" e
             INNER JOIN "editor_festival" ef ON e."id" = ef."idEditor"
             WHERE ef."festivalName" = $1
             ORDER BY e."name"`,
            [festivalName]
        );

        const editors = rows.map(row => ({
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo
        }));

        res.json(editors);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de suppression d'un éditeur par ID
router.delete('/:editorId', verifyToken, requireAdmin, validateNumericParam('editorId'), async (req, res) => {
    const editorId = req.params.editorId;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Supprimer les références dans game_mechanism (via les jeux de l'éditeur)
        await client.query(`
            DELETE FROM "game_mechanism" 
            WHERE "idGame" IN (SELECT "id" FROM "game" WHERE "idEditor" = $1)
        `, [editorId]);

        // 2. Supprimer les références dans game_planArea (via les jeux de l'éditeur)
        await client.query(`
            DELETE FROM "game_planArea" 
            WHERE "idGame" IN (SELECT "id" FROM "game" WHERE "idEditor" = $1)
        `, [editorId]);

        // 3. Supprimer les références dans game_festival (via les jeux de l'éditeur OU les réservations de l'éditeur)
        await client.query(`
            DELETE FROM "game_festival" 
            WHERE "idGame" IN (SELECT "id" FROM "game" WHERE "idEditor" = $1)
            OR "idReservation" IN (SELECT "idReservation" FROM "reservation" WHERE "idEditor" = $1)
        `, [editorId]);

        // 4. Supprimer les références dans suiviReservation (via les réservations de l'éditeur)
        await client.query(`
            DELETE FROM "suiviReservation" 
            WHERE "idReservation" IN (SELECT "idReservation" FROM "reservation" WHERE "idEditor" = $1)
        `, [editorId]);

        // 5. Supprimer les références dans reservation_game (via les réservations de l'éditeur OU les jeux de l'éditeur)
        // Note: DELETE CASCADE sur la FK aiderait, mais ici on le fait manuellement pour être sûr
        await client.query(`
            DELETE FROM "reservation_game" 
            WHERE "idReservation" IN (SELECT "idReservation" FROM "reservation" WHERE "idEditor" = $1)
            OR "idGame" IN (SELECT "id" FROM "game" WHERE "idEditor" = $1)
        `, [editorId]);

        // 6. Supprimer les jeux de l'éditeur
        await client.query('DELETE FROM "game" WHERE "idEditor" = $1', [editorId]);

        // 7. Supprimer les références dans editor_festival
        await client.query('DELETE FROM "editor_festival" WHERE "idEditor" = $1', [editorId]);

        // 8. Supprimer les références dans editor_planArea
        await client.query('DELETE FROM "editor_planArea" WHERE "idEditor" = $1', [editorId]);

        // 9. Supprimer les contacts de l'éditeur
        await client.query('DELETE FROM "contact" WHERE "idEditor" = $1', [editorId]);

        // 10. Supprimer les réservations de l'éditeur
        await client.query('DELETE FROM "reservation" WHERE "idEditor" = $1', [editorId]);

        // 11. Enfin, supprimer l'éditeur
        const { rowCount } = await client.query('DELETE FROM "editor" WHERE "id" = $1', [editorId]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Éditeur non trouvé" });
        }

        await client.query('COMMIT');
        return res.status(200).json({ message: 'Éditeur et toutes ses données associées ont été supprimés avec succès' });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error("Erreur lors de la suppression de l'éditeur:", err);
        return res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
    } finally {
        client.release();
    }
});

export default router
