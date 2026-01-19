import { Router } from 'express'
import pool from '../db/database.js'
import { requireAdmin } from '../middleware/auth-admin.js'
import { verifyToken } from '../middleware/token-management.js'

const router = Router()

// Route pour récupérer une zone de plan par son ID
router.get('/:planAreaId', verifyToken, async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        const { rows } = await pool.query('SELECT * FROM "planArea" WHERE "id" = $1', [planAreaId])
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
            'INSERT INTO "planArea" ("name", "nbSmallTables", "nbLargeTables", "nbCityHallTables", "festivalName", "idTZ") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id"',
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
router.get('/:planAreaId/games', verifyToken, async (req, res) => {
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
router.post('/:planAreaId/games', verifyToken, requireAdmin, async (req, res) => {
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
router.get('/:planAreaId/editors', verifyToken, async (req, res) => {
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
router.post('/:planAreaId/editors', verifyToken, requireAdmin, async (req, res) => {
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

// Route pour assigner un exemplaire de jeu à une zone du plan
router.post('/:planAreaId/assign-game', verifyToken, requireAdmin, async (req, res) => {
    const planAreaId = req.params.planAreaId;
    const { idGame, idReservation, festivalName } = req.body;

    if (!idGame || !idReservation || !festivalName) {
        return res.status(400).json({
            error: "ID du jeu, ID de la réservation et nom du festival obligatoires"
        });
    }

    try {
        // Validate the assignment
        await validateGameAssignment(
            parseInt(idGame),
            parseInt(idReservation),
            parseInt(planAreaId),
            festivalName
        );

        // Insert into game_festival
        await pool.query(
            `INSERT INTO "game_festival" ("idGame", "festivalName", "idReservation", "idPA", "isGamePlaced") 
             VALUES ($1, $2, $3, $4, $5)`,
            [idGame, festivalName, idReservation, planAreaId, false]
        );

        return res.status(201).json({ message: 'Jeu assigné à la zone du plan' });
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Cet exemplaire est déjà assigné à cette zone'
            });
        }
        if (err.message) {
            return res.status(400).json({ error: err.message });
        }
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour retirer un exemplaire de jeu d'une zone du plan
router.delete('/:planAreaId/games/:gameId/reservation/:reservationId', verifyToken, requireAdmin, async (req, res) => {
    const { planAreaId, gameId, reservationId } = req.params;

    try {
        const { rowCount } = await pool.query(
            `DELETE FROM "game_festival" 
             WHERE "idGame" = $1 AND "idPA" = $2 AND "idReservation" = $3`,
            [gameId, planAreaId, reservationId]
        );

        if (rowCount === 0) {
            return res.status(404).json({
                error: "Jeu non trouvé dans cette zone pour cette réservation"
            });
        }

        return res.status(200).json({ message: 'Jeu retiré de la zone du plan' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer les jeux assignés à une zone du plan (avec détails de réservation)
router.get('/:planAreaId/assigned-games', verifyToken, async (req, res) => {
    const planAreaId = req.params.planAreaId;
    try {
        const query = `
            SELECT 
                g.*,
                gf."idReservation",
                gf."isGamePlaced",
                gf."festivalName",
                r."idEditor",
                r."idTZ",
                e."name" as editor_name,
                e."logo" as editor_logo,
                gt."id" as gameType_id,
                gt."gameTypeLabel"
            FROM "game" g
            JOIN "game_festival" gf ON g."id" = gf."idGame"
            JOIN "reservation" r ON gf."idReservation" = r."idReservation"
            JOIN "editor" e ON r."idEditor" = e."id"
            LEFT JOIN "gameType" gt ON g."idGameType" = gt."id"
            WHERE gf."idPA" = $1
            ORDER BY e."name", g."name"
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
            idEditor: row.ideditor,
            idReservation: row.idreservation,
            isGamePlaced: row.isgameplaced,
            festivalName: row.festivalname,
            idTZ: row.idtz,
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
router.get('/:planAreaId/editors-from-games', verifyToken, async (req, res) => {
    const planAreaId = req.params.planAreaId;
    try {
        const query = `
            SELECT DISTINCT
                e.*,
                COUNT(DISTINCT gf."idGame") as game_count
            FROM "editor" e
            JOIN "reservation" r ON e."id" = r."idEditor"
            JOIN "game_festival" gf ON r."idReservation" = gf."idReservation"
            WHERE gf."idPA" = $1
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
router.delete('/:planAreaId', verifyToken, requireAdmin, async (req, res) => {
    const planAreaId = req.params.planAreaId
    try {
        // Vérifier si des jeux ou éditeurs sont associés à cette zone
        const { rows: gamesInArea } = await pool.query(
            'SELECT COUNT(*) as "count" FROM "game_planArea" WHERE "idPA" = $1',
            [planAreaId]
        )
        const { rows: editorsInArea } = await pool.query(
            'SELECT COUNT(*) as "count" FROM "editor_planArea" WHERE "idPA" = $1',
            [planAreaId]
        )

        if (parseInt(gamesInArea[0].count) > 0 || parseInt(editorsInArea[0].count) > 0) {
            return res.status(409).json({
                error: 'Impossible de supprimer cette zone car elle contient des jeux ou des éditeurs'
            })
        }

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

    if (planArea.rows[0].festivalname !== festivalName) {
        throw new Error("La zone du plan n'appartient pas au même festival que la réservation");
    }
}

export default router