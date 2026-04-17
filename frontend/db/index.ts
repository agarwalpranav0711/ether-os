import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// We do a safe check because the user still has to enter their Neon DB URL
const connectionString = 
  process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres') 
    ? process.env.DATABASE_URL 
    : 'postgres://dummy:dummy@localhost:5432/dummy';
const sql = neon(connectionString);
export const db = drizzle(sql);
