import pool from './src/db/database.js';

async function checkSchema() {
    try {
        const tables = ['reservation', 'editor', 'suivireservation', 'contact', 'game', 'gametype', 'tariffZone'];
        for (const table of tables) {
            console.log(`--- Columns for '${table}' ---`);
            const res = await pool.query(`
                SELECT column_name
                FROM information_schema.columns 
                WHERE table_name = '${table}' OR table_name = '${table.toLowerCase()}'
            `);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
