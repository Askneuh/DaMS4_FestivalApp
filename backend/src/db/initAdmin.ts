//import pool from './database.ts'
import bcrypt from 'bcryptjs'
import pool from './database.js'


export async function ensureAdmin() {
    const hash = await bcrypt.hash('admin', 10);
    console.log(hash)
    

    await pool.query(
        `INSERT INTO users (login, password_hash, role)
        VALUES ('admin', $1, 'admin')
        ON CONFLICT (login) DO NOTHING`,
        [hash]
    )
    console.log('� Compte admin vérifié ou créé');
} 