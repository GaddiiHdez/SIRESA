import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL no está configurada en las variables de entorno.');
}

const isProduction = process.env.NODE_ENV === 'production' || 
                     connectionString?.includes('neon.tech') || 
                     connectionString?.includes('sslmode=require');

const pool = new pg.Pool({ 
  connectionString,
  max: 20, // máximo de 20 conexiones en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 5000, // retornar error si la conexión tarda más de 5 segundos
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {})
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
export { pool };
