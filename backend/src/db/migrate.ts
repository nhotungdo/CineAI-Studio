import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'cineai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function migrate() {
  try {
    // Add error_message to scenes table if not exists
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS error_message TEXT;`);
    console.log('[Migrate] ✅ Added error_message column to scenes table');

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scenes' 
      ORDER BY column_name;
    `);
    console.log('[Migrate] scenes table columns:', result.rows.map(r => r.column_name).join(', '));
    
  } catch (err) {
    console.error('[Migrate Error]', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
