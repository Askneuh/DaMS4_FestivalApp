import pkg from 'pg'
const { Pool } = pkg
// Récupération de la variable d'environnement Docker
const pool = new Pool({
    connectionString:
        process.env['DATABASE_URL'] ||
        'postgres://festivalapp:festivalapp@localhost:5439/festivalapp',
    // Timeouts de sécurité
    connectionTimeoutMillis: 5000, // 5 secondes pour établir la connexion
    idleTimeoutMillis: 30000, // 30 secondes avant de fermer une connexion inactive
    statement_timeout: 10000, // 10 secondes max par requête SQL
});
export default pool
