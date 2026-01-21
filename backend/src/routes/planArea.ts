import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'
import { validateNumericParam, validateStringLengths, normalizeBooleans } from '../middleware/validation.js'
import { validatePlanAreaTableLimits } from '../middleware/validate-plan-area.js'

const router = Router()

// Route pour récupérer une zone de plan par son ID
router.get('/:planAreaId', verifyToken, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const { rows } = await pool.query('SELECT * FROM "planArea" WHERE "id" = $1', [planAreaId])
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Zone de plan non trouvée' })
        }
        res.json(rows[0])
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de création d'une zone de plan
router.post('/', verifyToken, requireAdmin, validateStringLengths({ name: 255, festivalName: 255 }), async (req, res) => {
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, festivalName, idTZ } = req.body

    if (!name || !festivalName) {
        return res.status(400).json({ error: "Nom et nom du festival obligatoires pour la création de zone de plan" })
    }

    if (!idTZ) {
        return res.status(400).json({ error: "ID de la zone tarifaire obligatoire" })
    }

    try {
        const smallTables = nbSmallTables || 0;
        const largeTables = nbLargeTables || 0;
        const cityHallTables = nbCityHallTables || 0;

        // Validate table limits before creating the plan area
        const validation = await validatePlanAreaTableLimits(
            idTZ,
            smallTables,
            largeTables,
            cityHallTables
        );

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { rows } = await pool.query(
            'INSERT INTO "planArea" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "festivalName", "idTZ") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id"',
            [name, smallTables, largeTables, cityHallTables, festivalName, idTZ || null]
        )
        return res.status(201).json({ message: 'Zone de plan créée', id: rows[0].id })
    } catch (err: any) {
        //Catch les erreurs d'unicité, ici de la clé primaire 
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Id de la zone du plan déjà existant' })
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Référence invalide (festival ou zone tarifaire inexistant)' })
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route de mise à jour d'une zone de plan
router.post('/update/:planAreaId', verifyToken, requireAdmin, validateNumericParam('planAreaId'), validateStringLengths({ name: 255, festivalName: 255 }), async (req, res) => {
    const planAreaId = req.params.planAreaId
    const { name, nbSmallTables, nbLargeTables, nbCityHallTables, festivalName, idTZ } = req.body
    try {
        // Validate table limits if any table counts or zone are being updated
        if (idTZ !== undefined && (nbSmallTables !== undefined || nbLargeTables !== undefined || nbCityHallTables !== undefined)) {
            // Get current values if not all are provided
            const currentQuery = await pool.query(
                'SELECT "nbSmallTables", "nbLargeTables", "nbCityHallTables", "idTZ" FROM "planArea" WHERE "id" = $1',
                [planAreaId]
            );

            if (currentQuery.rows.length === 0) {
                return res.status(404).json({ error: "Zone de plan non trouvée" });
            }

            const current = currentQuery.rows[0];
            const targetIdTZ = idTZ !== undefined ? idTZ : current.idTZ;

            const validation = await validatePlanAreaTableLimits(
                targetIdTZ,
                nbSmallTables !== undefined ? nbSmallTables : current.nbSmallTables,
                nbLargeTables !== undefined ? nbLargeTables : current.nbLargeTables,
                nbCityHallTables !== undefined ? nbCityHallTables : current.nbCityHallTables,
                parseInt(planAreaId as string) // Exclude this plan area from totals
            );

            if (!validation.valid) {
                return res.status(400).json({ error: validation.error });
            }
        }

        const { rowCount } = await pool.query(
            `UPDATE "planArea" SET 
                "name" = COALESCE($1, "name"), 
                "nbSmallTables" = COALESCE($2, "nbSmallTables"), 
                "nbLargeTables" = COALESCE($3, "nbLargeTables"), 
                "nbCityHallTables" = COALESCE($4, "nbCityHallTables"), 
                "festivalName" = COALESCE($5, "festivalName"),
                "idTZ" = $6
            WHERE "id" = $7`,
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
            'SELECT * FROM "planArea" WHERE "festivalName" = $1 ORDER BY "name"',
            [festivalName]
        )
        res.json(rows)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour récupérer les jeux d'une zone de plan
router.get('/:planAreaId/games', verifyToken, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const query = `
            SELECT g.*, gpa."quantity"
            FROM "game" g
            JOIN "game_planArea" gpa ON g."id" = gpa."idGame"
            WHERE gpa."idPA" = $1
            ORDER BY g."name"
            `
        const { rows } = await pool.query(query, [planAreaId])

        const games = rows.map(row => ({
            id: row.id,
            name: row.name,
            author: row.author,
            nbMinPlayer: row.nbminplayer,
            nbMaxPlayer: row.nbmaxplayer,
            gameNotice: row.gamenotice,
            idGameType: row.idgametype,
            minimumAge: row.minimumage,
            prototype: row.prototype,
            duration: row.duration,
            theme: row.theme,
            description: row.description,
            gameImage: row.gameimage,
            rulesTutorial: row.rulestutorial,
            edition: row.edition,
            idEditor: row.ideditor,
            quantity: row.quantity
        }))

        res.json(games)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour ajouter un jeu à une zone de plan
router.post('/:planAreaId/games', verifyToken, requireAdmin, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId
    const { idGame, quantity } = req.body

    if (!idGame) {
        return res.status(400).json({ error: "ID du jeu obligatoire" })
    }

    try {
        await pool.query(
            'INSERT INTO "game_planArea" ("idGame", "idPA", "quantity") VALUES ($1, $2, $3)',
            [idGame, planAreaId, quantity || 1]
        )
        return res.status(201).json({ message: 'Jeu ajouté à la zone' })
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ce jeu est déjà présent dans cette zone' })
        }
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})


// Route pour récupérer les éditeurs d'une zone de plan
router.get('/:planAreaId/editors', verifyToken, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const query = `
            SELECT e.*
        FROM "editor" e
            JOIN "editor_planArea" epa ON e."id" = epa."idEditor"
            WHERE epa."idPA" = $1
            ORDER BY e."name"
            `
        const { rows } = await pool.query(query, [planAreaId])

        // Map lowercase columns if necessary (though editor table is simple)
        // Adjust based on typical editor response structure
        const editors = rows.map(row => ({
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo
        }))

        res.json(editors)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour ajouter un éditeur à une zone de plan
router.post('/:planAreaId/editors', verifyToken, requireAdmin, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId
    const { idEditor } = req.body

    if (!idEditor) {
        return res.status(400).json({ error: "ID de l'éditeur obligatoire" })
    }

    try {
        await pool.query(
            'INSERT INTO "editor_planArea" ("idEditor", "idPA") VALUES ($1, $2)',
            [idEditor, planAreaId]
        )
        return res.status(201).json({ message: 'Éditeur ajouté à la zone' })
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Cet éditeur est déjà présent dans cette zone' })
        }
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Route pour assigner un jeu à une zone du plan (utilise game_planArea avec quantity et idReservation)
router.post('/:planAreaId/assign-game', verifyToken, requireAdmin, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId;
    const { idGame, quantity, idReservation } = req.body;

    if (!idGame || !idReservation) {
        return res.status(400).json({ error: "ID du jeu et ID de réservation obligatoires" });
    }

    const qty = quantity || 1;

    try {
        // Vérifier la quantité totale réservée
        const reservRes = await pool.query(
            'SELECT "quantity" FROM "reservation_game" WHERE "idGame" = $1 AND "idReservation" = $2',
            [idGame, idReservation]
        );

        if (reservRes.rows.length === 0) {
            return res.status(404).json({ error: "Ce jeu ne fait pas partie de cette réservation" });
        }
        const totalReserved = reservRes.rows[0].quantity;

        // Vérifier la quantité déjà placée (toutes zones confondues)
        const placedRes = await pool.query(
            'SELECT SUM("quantity") as total_placed FROM "game_planArea" WHERE "idGame" = $1 AND "idReservation" = $2',
            [idGame, idReservation]
        );
        const totalPlaced = parseInt(placedRes.rows[0].total_placed || '0', 10);

        // Quantité disponible actuellement
        const available = totalReserved - totalPlaced;

        // Si on met à jour une zone existante, attention au calcul (on ajoute qty à ce qui est déjà là)
        // Mais ici qty est le delta que l'on veut ajouter ? 
        // Le frontend envoie la quantité TOTALE voulue dans la zone ? Non, `addGameToExistingZone` envoie la quantité à AJOUTER (qty).
        // `assignSelectedGames` envoie la quantité sélectionnée.
        
        // Wait, frontend logic:
        // `assignGameToPlanArea` (addGameTo...): sends `qty`. Backend does UPDATE ... SET quantity = quantity + $1 OR INSERT ...
        // So `qty` is indeed an ADDITION amount.

        if (qty > available) {
            return res.status(400).json({ 
                error: `Impossible d'ajouter ${qty} exemplaire(s). Il n'en reste que ${available}.` 
            });
        }

        // Vérifier si le jeu pour cette réservation est déjà dans cette zone
        const existing = await pool.query(
            'SELECT "quantity" FROM "game_planArea" WHERE "idGame" = $1 AND "idPA" = $2 AND "idReservation" = $3',
            [idGame, planAreaId, idReservation]
        );

        if (existing.rows.length > 0) {
            // Mettre à jour la quantité
            await pool.query(
                'UPDATE "game_planArea" SET "quantity" = "quantity" + $1 WHERE "idGame" = $2 AND "idPA" = $3 AND "idReservation" = $4',
                [qty, idGame, planAreaId, idReservation]
            );
            
            // Marquer comme placé dans la réservation
            await pool.query(
                'UPDATE "reservation_game" SET "isGamePlaced" = true WHERE "idReservation" = $1 AND "idGame" = $2',
                [idReservation, idGame]
            );

            return res.status(200).json({ message: 'Quantité de jeu mise à jour' });
        } else {
            // Insérer nouvelle entrée
            await pool.query(
                'INSERT INTO "game_planArea" ("idGame", "idPA", "idReservation", "quantity") VALUES ($1, $2, $3, $4)',
                [idGame, planAreaId, idReservation, qty]
            );

            // Marquer comme placé dans la réservation
            await pool.query(
                'UPDATE "reservation_game" SET "isGamePlaced" = true WHERE "idReservation" = $1 AND "idGame" = $2',
                [idReservation, idGame]
            );

            return res.status(201).json({ message: 'Jeu assigné à la zone du plan' });
        }
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour retirer un jeu d'une zone du plan
router.delete('/:planAreaId/games/:gameId', verifyToken, requireAdmin, validateNumericParam('planAreaId'), validateNumericParam('gameId'), async (req, res) => {
    const { planAreaId, gameId } = req.params;
    const quantity = parseInt(req.query.quantity as string) || 1;
    const reservationId = parseInt(req.query.reservationId as string);

    if (!reservationId) {
        return res.status(400).json({ error: "ID de réservation obligatoire" });
    }

    try {
        // Récupérer la quantité actuelle pour cette réservation
        const current = await pool.query(
            'SELECT "quantity" FROM "game_planArea" WHERE "idGame" = $1 AND "idPA" = $2 AND "idReservation" = $3',
            [gameId, planAreaId, reservationId]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({ error: "Jeu non trouvé dans cette zone pour cette réservation" });
        }

        const currentQty = current.rows[0].quantity;

        if (currentQty <= quantity) {
            // Supprimer complètement l'entrée
            await pool.query(
                'DELETE FROM "game_planArea" WHERE "idGame" = $1 AND "idPA" = $2 AND "idReservation" = $3',
                [gameId, planAreaId, reservationId]
            );
        } else {
            // Réduire la quantité
            await pool.query(
                'UPDATE "game_planArea" SET "quantity" = "quantity" - $1 WHERE "idGame" = $2 AND "idPA" = $3 AND "idReservation" = $4',
                [quantity, gameId, planAreaId, reservationId]
            );
        }

        // Vérifier s'il reste des exemplaires placés pour ce jeu et cette réservation (toutes zones confondues)
        const checkRemaining = await pool.query(
            'SELECT COUNT(*) as count FROM "game_planArea" WHERE "idGame" = $1 AND "idReservation" = $2',
            [gameId, reservationId]
        );

        if (parseInt(checkRemaining.rows[0].count) === 0) {
            // Plus aucun exemplaire placé, on remet le flag à false
            await pool.query(
                'UPDATE "reservation_game" SET "isGamePlaced" = false WHERE "idReservation" = $1 AND "idGame" = $2',
                [reservationId, gameId]
            );
        }

        return res.status(200).json({ message: 'Jeu retiré de la zone du plan' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer les jeux assignés à une zone du plan (utilise game_planArea)
router.get('/:planAreaId/assigned-games', verifyToken, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId;
    try {
        const query = `
            SELECT 
                g.*,
                gpa."quantity",
                gpa."idReservation",
                rg."isGamePlaced",
                e."id" as editor_id,
                e."name" as editor_name,
                e."logo" as editor_logo,
                gt."id" as gameType_id,
                gt."gameTypeLabel"
            FROM "game" g
            JOIN "game_planArea" gpa ON g."id" = gpa."idGame"
            JOIN "reservation_game" rg ON gpa."idGame" = rg."idGame" AND gpa."idReservation" = rg."idReservation"
            LEFT JOIN "editor" e ON g."idEditor" = e."id"
            LEFT JOIN "gameType" gt ON g."idGameType" = gt."id"
            WHERE gpa."idPA" = $1
            ORDER BY g."name"
        `;

        const { rows } = await pool.query(query, [planAreaId]);

        const games = rows.map(row => ({
            id: row.id,
            name: row.name,
            author: row.author,
            nbMinPlayer: row.nbminplayer,
            nbMaxPlayer: row.nbmaxplayer,
            gameNotice: row.gamenotice,
            idGameType: row.idgametype,
            minimumAge: row.minimumage,
            prototype: row.prototype,
            duration: row.duration,
            theme: row.theme,
            description: row.description,
            gameImage: row.gameimage,
            rulesTutorial: row.rulestutorial,
            edition: row.edition,
            idEditor: row.ideditor || row.idEditor || row.editor_id,
            quantity: row.quantity,
            idReservation: row.idreservation || row.idReservation,
            isGamePlaced: row.isgameplaced || row.isGamePlaced,
            editorName: row.editor_name,
            editorLogo: row.editor_logo,
            gameType: row.gametype_id ? {
                id: row.gametype_id,
                gameTypeLabel: row.gametypelabel
            } : null
        }));

        res.json(games);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer les éditeurs présents dans une zone du plan (via les jeux assignés)
router.get('/:planAreaId/editors-from-games', verifyToken, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId;
    try {
        const query = `
            SELECT DISTINCT
                e.*,
                COUNT(DISTINCT gpa."idGame") as game_count
            FROM "editor" e
            JOIN "game" g ON e."id" = g."idEditor"
            JOIN "game_planArea" gpa ON g."id" = gpa."idGame"
            WHERE gpa."idPA" = $1
            GROUP BY e."id", e."name", e."exposant", e."distributeur", e."logo"
            ORDER BY e."name"
        `;

        const { rows } = await pool.query(query, [planAreaId]);

        const editors = rows.map(row => ({
            id: row.id,
            name: row.name,
            exposant: row.exposant,
            distributeur: row.distributeur,
            logo: row.logo,
            gameCount: parseInt(row.game_count)
        }));

        res.json(editors);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de suppression d'une zone de plan
router.delete('/:planAreaId', verifyToken, requireAdmin, validateNumericParam('planAreaId'), async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const { rowCount } = await pool.query('DELETE FROM "planArea" WHERE "id" = $1', [planAreaId])

        if (rowCount === 0) {
            return res.status(404).json({ error: "Zone de plan non trouvée" })
        }

        return res.status(200).json({ message: 'Zone de plan supprimée' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Helper function to validate game assignment
async function validateGameAssignment(
    idGame: number,
    idReservation: number,
    idPA: number,
    festivalName: string
) {
    // 1. Vérifier que le jeu est dans la réservation
    const gameInReservation = await pool.query(
        'SELECT "quantity" FROM "reservation_game" WHERE "idReservation" = $1 AND "idGame" = $2',
        [idReservation, idGame]
    );

    if (gameInReservation.rows.length === 0) {
        throw new Error("Ce jeu n'est pas dans cette réservation");
    }

    const totalQuantity = gameInReservation.rows[0].quantity;

    // 2. Compter les exemplaires déjà assignés
    const assignedCount = await pool.query(
        'SELECT COUNT(*) as count FROM "game_festival" WHERE "idGame" = $1 AND "idReservation" = $2',
        [idGame, idReservation]
    );

    const assigned = parseInt(assignedCount.rows[0].count);

    if (assigned >= totalQuantity) {
        throw new Error(`Tous les exemplaires de ce jeu sont déjà assignés (${totalQuantity}/${totalQuantity})`);
    }

    // 3. Vérifier que la zone du plan appartient au bon festival
    const planArea = await pool.query(
        'SELECT "festivalName" FROM "planArea" WHERE "id" = $1',
        [idPA]
    );

    if (planArea.rows.length === 0) {
        throw new Error("Zone du plan introuvable");
    }

    const planAreaFestival = planArea.rows[0].festivalName || planArea.rows[0].festivalname;
    if (planAreaFestival !== festivalName) {
        throw new Error("La zone du plan n'appartient pas au même festival que la réservation");
    }
}

export default router