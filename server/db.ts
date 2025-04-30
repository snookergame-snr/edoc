import { drizzle } from 'drizzle-orm/node-postgres'; // ✅
import { Pool } from 'pg';
import 'dotenv/config';

//neonConfig.webSocketConstructor = ws;

//export const pool = new Pool({ connectionString: process.env.DATABASE_URL ,ssl: false,});
//export const db = drizzle(pool, { schema });


export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // <-- ใส่ ssl: false ถ้า server ไม่มี SSL
});

export const db = drizzle(pool);