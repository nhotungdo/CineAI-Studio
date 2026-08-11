import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `Host=${process.env.DB_HOST || 'localhost'};Port=${process.env.DB_PORT || 5432};Database=${process.env.DB_NAME || 'cineai_db'};Username=${process.env.DB_USER || 'postgres'};Password=${process.env.DB_PASSWORD || '123456'};`;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'cineai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('[PostgreSQL Query Error]', { text, error });
    throw error;
  }
}
