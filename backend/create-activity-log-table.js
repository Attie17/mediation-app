import { pool } from './src/db.js';

async function createActivityLogTable() {
  try {
    console.log('Creating admin_activity_log table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_activity_log (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES app_users(user_id) ON DELETE SET NULL,
        action_type VARCHAR(50) NOT NULL,
        target_type VARCHAR(50),
        target_id UUID,
        description TEXT NOT NULL,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ admin_activity_log table created');

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON admin_activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON admin_activity_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON admin_activity_log(action_type);
    `);

    console.log('✅ Indexes created');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating activity log table:', error);
    process.exit(1);
  }
}

createActivityLogTable();
