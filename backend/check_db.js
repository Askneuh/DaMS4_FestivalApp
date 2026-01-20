import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgres://festivalapp:festivalapp@localhost:5439/festivalapp'
});

async function check() {
  try {
    // Insérer un test et récupérer
    const ins = await pool.query(`INSERT INTO suivireservation (status, date, idreservation, commentaire) VALUES ('Test', NOW(), 6, 'test timezone') RETURNING *`);
    console.log('Inserted row:', JSON.stringify(ins.rows[0], null, 2));
    
    // Récupérer les derniers
    const data = await pool.query(`SELECT id, status, date, date AT TIME ZONE 'Europe/Paris' as date_paris FROM suivireservation ORDER BY id DESC LIMIT 3`);
    console.log('Recent data:', JSON.stringify(data.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
