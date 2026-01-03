import pkg from 'pg'
const { Pool } = pkg
// Récupération de la variable d'environnement Docker
const pool = new Pool({
 connectionString:
 process.env['DATABASE_URL'] ||
 'postgres://festivalapp:festivalapp@localhost:5439/festivalapp'
});
export default pool
