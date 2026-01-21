
import pool from './db/database';

async function checkRefs() {
    try {
        console.log('--- Vérification des gameType ---');
        const resGT = await pool.query('SELECT * FROM "gameType"');
        console.table(resGT.rows);

        console.log('--- Vérification des éditeurs ---');
        const resEd = await pool.query('SELECT id, name FROM "editor" LIMIT 10');
        console.table(resEd.rows);

    } catch (err) {
        console.error('Erreur:', err);
    } finally {
        await pool.end();
    }
}

checkRefs();
