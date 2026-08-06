/**
 * ============================================================
 * Configuración de Base de Datos — Prisma + PostgreSQL
 * ============================================================
 *
 * Este módulo inicializa y exporta:
 *  - `pool`: el pool de conexiones de pg (PostgreSQL nativo) que
 *     gestiona conexiones reutilizables y evita crear una nueva
 *     conexión en cada petición HTTP.
 *  - `prisma`: el cliente ORM de Prisma que usa el pool anterior
 *     para ejecutar consultas de forma segura y tipada.
 *
 * En producción (Railway, Neon, etc.) se habilita SSL automáticamente
 * para cifrar la comunicación con la base de datos en la nube.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

// Cargar variables de entorno (.env) para que DATABASE_URL esté disponible
dotenv.config();

// URL de conexión a PostgreSQL — requerida para que el servidor funcione
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL no está configurada en las variables de entorno.');
}

// Detectar si estamos en producción para habilitar SSL.
// Se activa cuando NODE_ENV=production o cuando la URL contiene indicadores
// de servicios en la nube como Neon o sslmode=require.
const isProduction = process.env.NODE_ENV === 'production' ||
                     connectionString?.includes('neon.tech') ||
                     connectionString?.includes('sslmode=require');

// ─── Pool de Conexiones ────────────────────────────────────────────────────────
// El pool mantiene un conjunto de conexiones abiertas y las reutiliza.
// Esto es mucho más eficiente que abrir/cerrar una conexión por cada petición.
const pool = new pg.Pool({
  connectionString,
  max: 20,                    // Máximo de conexiones simultáneas (reducir a 5 en Railway free tier)
  idleTimeoutMillis: 30000,   // Cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 5000, // Devolver error si una conexión tarda más de 5 segundos

  // En entornos de producción/nube, habilitar SSL para cifrar la conexión.
  // rejectUnauthorized: false permite certificados autofirmados (común en servicios cloud)
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {})
});

// ─── Prisma Client ─────────────────────────────────────────────────────────────
// PrismaPg conecta Prisma con el pool de pg para aprovechar la reutilización
// de conexiones en lugar de que Prisma gestione las suyas propias.
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Exportar el cliente Prisma como default (para usar en controladores y servicios)
// y el pool de forma nombrada (para el Graceful Shutdown en server.js)
export default prisma;
export { pool };
