import fs from 'fs';
import path from 'path';
import { pool } from './index.js';

async function init() {
  try {
    const sqlPath = path.resolve(process.cwd(), '../database/seed/01_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log('[DB Init] Dropping tables if exists...');
    await pool.query(`
      DROP TABLE IF EXISTS credit_transactions CASCADE;
      DROP TABLE IF EXISTS credits CASCADE;
      DROP TABLE IF EXISTS exports CASCADE;
      DROP TABLE IF EXISTS scene_generations CASCADE;
      DROP TABLE IF EXISTS scenes CASCADE;
      DROP TABLE IF EXISTS video_jobs CASCADE;
      DROP TABLE IF EXISTS storyboards CASCADE;
      DROP TABLE IF EXISTS scripts CASCADE;
      DROP TABLE IF EXISTS characters CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('[DB Init] Running initial schema script...');
    await pool.query(sql);
    console.log('[DB Init] Database initialized successfully!');
  } catch (err) {
    console.error('[DB Init Error]', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

init();
