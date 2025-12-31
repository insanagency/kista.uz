import pool from '../config/database.js';

const migrate = async () => {
  try {
    console.log('🔄 Adding role column to users table...');

    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN 
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'; 
        END IF; 
      END $$;
    `);

    console.log('✅ Role column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
