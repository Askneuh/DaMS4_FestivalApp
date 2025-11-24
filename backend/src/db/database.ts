import pkg from 'pg'
const { Pool } = pkg
// Récupération de la variable d'environnement Docker
const pool = new Pool({
 connectionString:
 process.env['DATABASE_URL'] ||
 'postgres://secureapp:secureapp@localhost:5433/secureapp'
});
export default pool
