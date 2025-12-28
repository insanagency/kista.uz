
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_TQa9Fyd1KcBx@ep-late-hill-adnii0uf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const test = async () => {
    try {
        console.log('Testing query for user 6...');
        const { rows } = await pool.query('SELECT id, full_name, email, created_at FROM users WHERE id = $1', [6]);
        console.log('Result:', rows[0]);
    } catch (e) {
        console.error('Query failed:', e);
    } finally {
        pool.end();
    }
};

test();
