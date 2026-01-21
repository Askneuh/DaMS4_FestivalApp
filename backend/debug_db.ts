
import pool from './src/db/database';

async function debugDb() {
    try {
        console.log('--- Reservation Game ---');
        const resRG = await pool.query('SELECT * FROM "reservation_game" LIMIT 20');
        console.log(JSON.stringify(resRG.rows, null, 2));
    } catch (err) {
        console.error('Erreur:', err);
    } finally {
        await pool.end();
    }
}

debugDb();
