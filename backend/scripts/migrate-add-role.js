
import pool from '../config/database.js';

const addRoleColumn = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Adding role column to users table...');

    await client.query('BEGIN');

    // Add role column to users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);
    console.log('✅ Added role column to users');

    await client.query('COMMIT');
    console.log('🎉 Role column migration completed!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addRoleColumn().catch(console.error);
