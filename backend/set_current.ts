import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgres://festivalapp:festivalapp@127.0.0.1:5439/festivalapp'
});

async function setLatestAsCurrent() {
  try {
    await pool.query('UPDATE "festival" SET "isCurrent" = FALSE');
    const { rows } = await pool.query('SELECT name FROM "festival" ORDER BY name DESC LIMIT 1');
    if (rows.length > 0) {
      await pool.query('UPDATE "festival" SET "isCurrent" = TRUE WHERE name = $1', [rows[0].name]);
      console.log(`Festival "${rows[0].name}" is now current.`);
    } else {
      console.log('No festivals found to mark as current.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

setLatestAsCurrent();
