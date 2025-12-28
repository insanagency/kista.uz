import pool from '../config/database.js';

const applySchemaUpdates = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Checking for schema updates...');

        // 1. Add currency to budgets table
        try {
            await client.query(`
        ALTER TABLE budgets 
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'
      `);
            console.log('✅ Budgets table checked/updated for currency column');
        } catch (e) {
            console.error('⚠️ Failed to alter budgets table:', e.message);
        }

        // 2. Add created_at to users table
        try {
            await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
            console.log('✅ Users table checked/updated for created_at column');
        } catch (e) {
            console.error('⚠️ Failed to alter users table:', e.message);
        }

        // 3. Add updated_at to users table if missing
        try {
            await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
            console.log('✅ Users table checked/updated for updated_at column');
        } catch (e) {
            console.error('⚠️ Failed to alter users table:', e.message);
        }

        console.log('✅ All schema updates completed');
    } catch (error) {
        console.error('❌ Schema update wrapper failed:', error);
    } finally {
        client.release();
    }
};

export default applySchemaUpdates;

// Execute if run directly
if (process.argv[1] === import.meta.filename) {
    applySchemaUpdates();
} else {
    // Fallback for older node versions or different environments
    applySchemaUpdates();
}
