import { Router } from 'express'
import pool from '../db/database.js'
import { requireOrganizer } from '../middleware/auth-organizer.js'
import { verifyToken } from '../middleware/token-management.js'
import { validateNumericParam, validateStringLengths, normalizeBooleans } from '../middleware/validation.js'

const router = Router()

router.get('/:reservationId', verifyToken, requireOrganizer, validateNumericParam('reservationId'), async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const query = `
            SELECT r.*, 
                   e."id" as editor_id, e."name" as editor_name, e."exposant", e."distributeur", e."logo",
                   COALESCE(
                       (SELECT json_agg(g.*) 
                        FROM "game" g 
                        WHERE g."idEditor" = e."id"), 
                       '[]'
                   ) as editor_games
            FROM "reservation" r
            JOIN "editor" e ON r."idEditor" = e."id"
            WHERE r."idReservation" = $1
        `;
        const { rows } = await pool.query(query, [reservationId])

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Réservation non trouvée' });
        }

        const row = rows[0];

        // Map PostgreSQL column names (which are CaseSensitive here because of quotes in creation)
        const reservation = {
            idReservation: row.idReservation,
            idEditor: row.idEditor,
            status: row.status,
            nbSmallTables: row.nbSmallTables,
            nbLargeTables: row.nbLargeTables,
            nbCityHallTables: row.nbCityHallTables,
            m2: row.m2 || 0,
            remise: row.remise,
            typeAnimateur: row.typeAnimateur,
            listeDemandee: row.listeDemandee,
            listeRecue: row.listeRecue,
            jeuxRecus: row.jeuxRecus,
            festivalName: row.festivalName,
            idTZ: row.idTZ,
            editor: {
                id: row.editor_id,
                name: row.editor_name,
                exposant: row.exposant,
                distributeur: row.distributeur,
                logo: row.logo,
                games: row.editor_games
            }
        };

        res.json(reservation)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une réservation
router.post('/', verifyToken, requireOrganizer, validateStringLengths({ status: 255, festivalName: 255 }), normalizeBooleans(['listeDemandee', 'listeRecue', 'jeuxRecus']), async (req, res) => {
    const { idEditor, status, nbSmallTables, nbLargeTables, nbCityHallTables, m2, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, festivalName, idTZ } = req.body

    // Validation des champs obligatoires
    if (!idEditor || !festivalName) {
        return res.status(400).json({ error: "ID éditeur et nom du festival obligatoires" })
    }

    // Validation des valeurs numériques
    const smallTables = nbSmallTables || 0;
    const largeTables = nbLargeTables || 0;
    const cityHallTables = nbCityHallTables || 0;
    const discount = remise || 0;

    if (smallTables < 0 || largeTables < 0 || cityHallTables < 0) {
        return res.status(400).json({ error: "Le nombre de tables ne peut pas être négatif" })
    }
    if (discount < 0) {
        return res.status(400).json({ error: "La remise ne peut pas être négative" })
    }

    // Validation de la capacité de la zone tarifaire (si idTZ fourni)
    if (idTZ) {
        try {
            await checkTableCapacity(idTZ, -1, smallTables, largeTables, cityHallTables);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            'INSERT INTO "reservation" ("idEditor", "status", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "m2", "remise", "typeAnimateur", "listeDemandee", "listeRecue", "jeuxRecus", "festivalName", "idTZ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING "idReservation"',
            [idEditor, status || 'Contact pris', smallTables, largeTables, cityHallTables, m2 || 0, discount, typeAnimateur || 0, listeDemandee || false, listeRecue || false, jeuxRecus || false, festivalName, idTZ || null]
        )

        // Mettre à jour les tables restantes de la zone tarifaire
        if (idTZ) {
            await updateZoneRemainingTables(client, idTZ);
        }

        // Mettre à jour les tables restantes du festival
        await updateFestivalRemainingTables(client, festivalName);

        await client.query('COMMIT');
        return res.status(201).json({ message: 'Réservation créée', id: rows[0].idReservation })
    } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Réservation déjà existante' })
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Référence invalide (éditeur, festival ou zone tarifaire inexistant)' })
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    } finally {
        client.release();
    }
})

// Route de mise à jour d'une réservation
router.post('/update/:reservationId', verifyToken, requireOrganizer, validateNumericParam('reservationId'), validateStringLengths({ status: 255 }), normalizeBooleans(['listeDemandee', 'listeRecue', 'jeuxRecus']), async (req, res) => {
    const reservationId = req.params.reservationId
    const { status, nbSmallTables, nbLargeTables, nbCityHallTables, m2, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, idTZ } = req.body
    try {
        // 1. Récupérer la réservation actuelle pour avoir les valeurs courantes si non fournies
        const currentRes = await pool.query('SELECT * FROM "reservation" WHERE "idReservation" = $1', [reservationId]);
        if (currentRes.rows.length === 0) {
            return res.status(404).json({ error: "Réservation non trouvée" });
        }
        const current = currentRes.rows[0];

        // 2. Déterminer les valeurs cibles
        // Si idTZ change, on vérifie dans la NOUVELLE zone
        const targetIdTZ = idTZ !== undefined ? idTZ : current.idTZ;

        // Si les tables sont fournies, on prend la nouvelle valeur, sinon on garde l'ancienne
        const targetSmall = nbSmallTables !== undefined ? nbSmallTables : current.nbSmallTables;
        const targetLarge = nbLargeTables !== undefined ? nbLargeTables : current.nbLargeTables;
        const targetCityHall = nbCityHallTables !== undefined ? nbCityHallTables : current.nbCityHallTables;

        // 3. Valider la capacité
        if (targetIdTZ) {
            await checkTableCapacity(targetIdTZ, parseInt(reservationId ?? "0"), targetSmall, targetLarge, targetCityHall);
        }

        // 4. Update
        const { rowCount } = await pool.query(
            `UPDATE "reservation" SET 
                "status" = COALESCE($1, "status"), 
                "nbSmallTables" = COALESCE($2, "nbSmallTables"), 
                "nbLargeTables" = COALESCE($3, "nbLargeTables"), 
                "nbCityHallTables" = COALESCE($4, "nbCityHallTables"), 
                "m2" = COALESCE($5, "m2"),
                "remise" = COALESCE($6, "remise"), 
                "typeAnimateur" = COALESCE($7, "typeAnimateur"), 
                "listeDemandee" = COALESCE($8, "listeDemandee"), 
                "listeRecue" = COALESCE($9, "listeRecue"), 
                "jeuxRecus" = COALESCE($10, "jeuxRecus"), 
                "idTZ" = COALESCE($11, "idTZ") 
            WHERE "idReservation" = $12`,
            [status, nbSmallTables, nbLargeTables, nbCityHallTables, m2, remise, typeAnimateur, listeDemandee, listeRecue, jeuxRecus, idTZ, reservationId]
        )
        if (rowCount === 0) {
            return res.status(404).json({ error: "Réservation non trouvée" })
        }

        // Mettre à jour les tables restantes
        // Si la zone a changé, mettre à jour les deux zones
        const updateClient = await pool.connect();
        try {
            if (idTZ !== undefined && idTZ !== current.idTZ) {
                // Ancienne zone
                if (current.idTZ) {
                    await updateZoneRemainingTables(updateClient, current.idTZ);
                }
                // Nouvelle zone
                await updateZoneRemainingTables(updateClient, idTZ);
            } else if (targetIdTZ) {
                // Même zone, juste mise à jour des quantités
                await updateZoneRemainingTables(updateClient, targetIdTZ);
            }

            // Mettre à jour les tables restantes du festival
            await updateFestivalRemainingTables(updateClient, current.festivalName);
        } finally {
            updateClient.release();
        }

        return res.status(200).json({ message: 'Réservation mise à jour' })
    } catch (err: any) {
        if (err.message && err.message.startsWith('Capacité')) {
            return res.status(400).json({ error: err.message });
        }
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer les réservations d'un editeur 
router.get('/byEditor/:idEditor', verifyToken, requireOrganizer, validateNumericParam('idEditor'), async (req, res) => {
    const idEditor = req.params.idEditor
    try {
        const query = `
            SELECT r.*, 
                   e."id" as editor_id, e."name" as editor_name, e."exposant", e."distributeur", e."logo",
                   COALESCE(
                       (SELECT json_agg(g.*) 
                        FROM "game" g 
                        WHERE g."idEditor" = e."id"), 
                       '[]'
                   ) as editor_games
            FROM "reservation" r
            JOIN "editor" e ON r."idEditor" = e."id"
            WHERE r."idEditor" = $1
        `;
        const { rows } = await pool.query(query, [idEditor])

        const reservations = rows.map(row => ({
            idReservation: row.idReservation,
            idEditor: row.idEditor,
            status: row.status,
            nbSmallTables: row.nbSmallTables,
            nbLargeTables: row.nbLargeTables,
            nbCityHallTables: row.nbCityHallTables,
            remise: row.remise,
            typeAnimateur: row.typeAnimateur,
            listeDemandee: row.listeDemandee,
            listeRecue: row.listeRecue,
            jeuxRecus: row.jeuxRecus,
            festivalName: row.festivalName,
            idTZ: row.idTZ,
            editor: {
                id: row.editor_id,
                name: row.editor_name,
                exposant: row.exposant,
                distributeur: row.distributeur,
                logo: row.logo,
                games: row.editor_games
            }
        }));

        res.json(reservations)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

//Route pour récupérer les réservations d'un festival
router.get('/byFestival/:festivalName', verifyToken, requireOrganizer, async (req, res) => {
    const festivalName = req.params.festivalName
    try {
        const query = `
            SELECT r.*, 
                   e."id" as editor_id, e."name" as editor_name, e."exposant", e."distributeur", e."logo",
                   COALESCE(
                       (SELECT json_agg(g.*) 
                        FROM "game" g 
                        WHERE g."idEditor" = e."id"), 
                       '[]'
                   ) as editor_games
            FROM "reservation" r
            JOIN "editor" e ON r."idEditor" = e."id"
            WHERE r."festivalName" = $1
        `;
        const { rows } = await pool.query(query, [festivalName])

        const reservations = rows.map(row => ({
            idReservation: row.idReservation,
            idEditor: row.idEditor,
            status: row.status,
            nbSmallTables: row.nbSmallTables,
            nbLargeTables: row.nbLargeTables,
            nbCityHallTables: row.nbCityHallTables,
            remise: row.remise,
            typeAnimateur: row.typeAnimateur,
            listeDemandee: row.listeDemandee,
            listeRecue: row.listeRecue,
            jeuxRecus: row.jeuxRecus,
            festivalName: row.festivalName,
            idTZ: row.idTZ,
            editor: {
                id: row.editor_id,
                name: row.editor_name,
                exposant: row.exposant,
                distributeur: row.distributeur,
                logo: row.logo,
                games: row.editor_games
            }
        }));

        res.json(reservations)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer les jeux d'une réservation
router.get('/:reservationId/games', verifyToken, requireOrganizer, validateNumericParam('reservationId'), async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const query = `
            SELECT g.*, rg."isGamePlaced", rg."quantity", rg."idReservation",
                   gt."id" as gameType_id, gt."gameTypeLabel"
            FROM "game" g
            JOIN "reservation_game" rg ON g."id" = rg."idGame"
            LEFT JOIN "gameType" gt ON g."idGameType" = gt."id"
            WHERE rg."idReservation" = $1
        `
        const { rows } = await pool.query(query, [reservationId])

        const games = rows.map(row => ({
            id: row.id,
            name: row.name,
            author: row.author,
            nbMinPlayer: row.nbMinPlayer,
            nbMaxPlayer: row.nbMaxPlayer,
            gameNotice: row.gameNotice,
            idGameType: row.idGameType,
            minimumAge: row.minimumAge,
            prototype: row.prototype,
            duration: row.duration,
            theme: row.theme,
            description: row.description,
            gameImage: row.gameImage,
            rulesTutorial: row.rulesTutorial,
            edition: row.edition,
            idEditor: row.idEditor,
            isGamePlaced: row.isGamePlaced,
            quantity: row.quantity,
            idReservation: row.idReservation,
            gameType: row.gametype_id ? {
                id: row.gametype_id,
                gameTypeLabel: row.gameTypeLabel
            } : null
        }))

        res.json(games)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour ajouter un jeu à une réservation
router.post('/:reservationId/games', verifyToken, requireOrganizer, validateNumericParam('reservationId'), async (req, res) => {
    const reservationId = req.params.reservationId
    const { idGame, quantity } = req.body

    if (!idGame) {
        return res.status(400).json({ error: "ID du jeu obligatoire" })
    }

    try {
        await pool.query(
            'INSERT INTO "reservation_game" ("idReservation", "idGame", "isGamePlaced", "quantity") VALUES ($1, $2, $3, $4)',
            [reservationId, idGame, false, quantity || 1]
        )
        return res.status(201).json({ message: 'Jeu ajouté à la réservation' })
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ce jeu est déjà dans cette réservation' })
        }
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour mettre à jour un jeu dans une réservation (quantité, placement)
router.put('/:reservationId/games/:gameId', verifyToken, requireOrganizer, validateNumericParam('reservationId'), validateNumericParam('gameId'), normalizeBooleans(['isGamePlaced']), async (req, res) => {
    const { reservationId, gameId } = req.params
    const { quantity, isGamePlaced } = req.body

    try {
        const { rowCount } = await pool.query(
            `UPDATE "reservation_game" 
             SET "quantity" = COALESCE($1, "quantity"), 
                 "isGamePlaced" = COALESCE($2, "isGamePlaced")
             WHERE "idReservation" = $3 AND "idGame" = $4`,
            [quantity, isGamePlaced, reservationId, gameId]
        )

        if (rowCount === 0) {
            return res.status(404).json({ error: "Jeu non trouvé dans cette réservation" })
        }

        return res.status(200).json({ message: 'Jeu mis à jour dans la réservation' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour retirer un jeu d'une réservation
router.delete('/:reservationId/games/:gameId', verifyToken, requireOrganizer, validateNumericParam('reservationId'), validateNumericParam('gameId'), async (req, res) => {
    const { reservationId, gameId } = req.params

    try {
        const { rowCount } = await pool.query(
            'DELETE FROM "reservation_game" WHERE "idReservation" = $1 AND "idGame" = $2',
            [reservationId, gameId]
        )

        if (rowCount === 0) {
            return res.status(404).json({ error: "Jeu non trouvé dans cette réservation" })
        }

        return res.status(200).json({ message: 'Jeu retiré de la réservation' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour supprimer une réservation
router.delete('/:reservationId', verifyToken, requireOrganizer, validateNumericParam('reservationId'), async (req, res) => {
    const reservationId = req.params.reservationId
    try {
        const { rowCount } = await pool.query('DELETE FROM "reservation" WHERE "idReservation" = $1', [reservationId])

        if (rowCount === 0) {
            return res.status(404).json({ error: "Réservation non trouvée" })
        }

        return res.status(200).json({ message: 'Réservation supprimée' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})


export default router


async function checkTableCapacity(idTZ: number, excludeResId: number, newSmall: number, newLarge: number, newCityHall: number) {
    const query = `
        SELECT
            tz."nbSmallTables" as total_small,
            tz."nbLargeTables" as total_large,
            tz."nbCityHallTables" as total_city_hall,
            (SELECT COALESCE(SUM("nbSmallTables"), 0) FROM "reservation" WHERE "idTZ" = $1 AND "idReservation" != $2) as used_small,
            (SELECT COALESCE(SUM("nbLargeTables"), 0) FROM "reservation" WHERE "idTZ" = $1 AND "idReservation" != $2) as used_large,
            (SELECT COALESCE(SUM("nbCityHallTables"), 0) FROM "reservation" WHERE "idTZ" = $1 AND "idReservation" != $2) as used_city_hall
        FROM "tariffZone" tz
        WHERE tz."idTZ" = $1
    `;
    const { rows } = await pool.query(query, [idTZ, excludeResId]);

    if (rows.length === 0) throw new Error("Zone tarifaire introuvable");

    const data = rows[0];
    const availableTheoreticallySmall = data.total_small;
    const currentUsedSmall = parseInt(data.used_small);

    if (currentUsedSmall + newSmall > availableTheoreticallySmall) {
        throw new Error(`Capacité dépassée pour les petites tables (Max: ${availableTheoreticallySmall}, Utilisées: ${currentUsedSmall}, Demandées: ${newSmall})`);
    }

    const availableTheoreticallyLarge = data.total_large;
    const currentUsedLarge = parseInt(data.used_large);

    if (currentUsedLarge + newLarge > availableTheoreticallyLarge) {
        throw new Error(`Capacité dépassée pour les grandes tables (Max: ${availableTheoreticallyLarge}, Utilisées: ${currentUsedLarge}, Demandées: ${newLarge})`);
    }

    const availableTheoreticallyCityp = data.total_city_hall;
    const currentUsedCityp = parseInt(data.used_city_hall);

    if (currentUsedCityp + newCityHall > availableTheoreticallyCityp) {
        throw new Error(`Capacité dépassée pour les tables de réception (Max: ${availableTheoreticallyCityp}, Utilisées: ${currentUsedCityp}, Demandées: ${newCityHall})`);
    }
}

/**
 * Met à jour les tables restantes d'une zone tarifaire
 * en recalculant depuis toutes les réservations actives
 * @param client - Client PostgreSQL (peut être une transaction)
 * @param idTZ - ID de la zone tarifaire à mettre à jour
 */
async function updateZoneRemainingTables(client: any, idTZ: number) {
    // 1. Récupérer le total de tables de la zone
    const zoneQuery = `
        SELECT "nbSmallTables", "nbLargeTables", "nbCityHallTables"
        FROM "tariffZone"
        WHERE "idTZ" = $1
    `;
    const { rows: zoneRows } = await client.query(zoneQuery, [idTZ]);

    if (zoneRows.length === 0) {
        throw new Error("Zone tarifaire introuvable");
    }

    const zone = zoneRows[0];

    // 2. Calculer le total utilisé par les réservations (including m² converted to small tables)
    const usedQuery = `
        SELECT 
            COALESCE(SUM("nbSmallTables" + CEIL(COALESCE("m2", 0)::float / 4)), 0) as used_small,
            COALESCE(SUM("nbLargeTables"), 0) as used_large,
            COALESCE(SUM("nbCityHallTables"), 0) as used_city_hall
        FROM "reservation"
        WHERE "idTZ" = $1
    `;
    const { rows: usedRows } = await client.query(usedQuery, [idTZ]);
    const used = usedRows[0];

    // 3. Calculer les tables restantes
    const remainingSmall = zone.nbSmallTables - parseInt(used.used_small);
    const remainingLarge = zone.nbLargeTables - parseInt(used.used_large);
    const remainingCityHall = zone.nbCityHallTables - parseInt(used.used_city_hall);

    // 4. Mettre à jour la zone tarifaire
    console.log(`[DEBUG] Updating Zone ${idTZ}: Total Small=${zone.nbSmallTables}, Used=${used.used_small}, Remaining=${remainingSmall}`);
    const updateQuery = `
        UPDATE "tariffZone"
        SET 
            "remainingSmallTables" = $1,
            "remainingLargeTables" = $2,
            "remainingCityHallTables" = $3
        WHERE "idTZ" = $4
    `;
    await client.query(updateQuery, [remainingSmall, remainingLarge, remainingCityHall, idTZ]);
}

/**
 * Met à jour les tables restantes d'un festival
 * en recalculant depuis toutes les réservations actives
 * @param client - Client PostgreSQL (peut être une transaction)
 * @param festivalName - Nom du festival à mettre à jour
 */
async function updateFestivalRemainingTables(client: any, festivalName: string) {
    // 1. Récupérer le total de tables du festival
    const festivalQuery = `
        SELECT "nbSmallTables", "nbLargeTables", "nbCityHallTables"
        FROM "festival"
        WHERE "name" = $1
    `;
    const { rows: festivalRows } = await client.query(festivalQuery, [festivalName]);

    if (festivalRows.length === 0) {
        throw new Error("Festival introuvable");
    }

    const festival = festivalRows[0];

    // 2. Calculer le total utilisé par toutes les réservations du festival (including m² converted to small tables)
    const usedQuery = `
        SELECT 
            COALESCE(SUM("nbSmallTables" + CEIL(COALESCE("m2", 0)::float / 4)), 0) as used_small,
            COALESCE(SUM("nbLargeTables"), 0) as used_large,
            COALESCE(SUM("nbCityHallTables"), 0) as used_city_hall
        FROM "reservation"
        WHERE "festivalName" = $1
    `;
    const { rows: usedRows } = await client.query(usedQuery, [festivalName]);
    const used = usedRows[0];

    // 3. Calculer les tables restantes
    const remainingSmall = festival.nbSmallTables - parseInt(used.used_small);
    const remainingLarge = festival.nbLargeTables - parseInt(used.used_large);
    const remainingCityHall = festival.nbCityHallTables - parseInt(used.used_city_hall);

    // 4. Mettre à jour le festival
    console.log(`[DEBUG] Updating Festival ${festivalName}: Total Small=${festival.nbSmallTables}, Used=${used.used_small}, Remaining=${remainingSmall}`);
    const updateQuery = `
        UPDATE "festival"
        SET 
            "remainingSmallTables" = $1,
            "remainingLargeTables" = $2,
            "remainingCityHallTables" = $3
        WHERE "name" = $4
    `;
    await client.query(updateQuery, [remainingSmall, remainingLarge, remainingCityHall, festivalName]);
}
