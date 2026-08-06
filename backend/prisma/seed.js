/**
 * ============================================================
 * Script de Siembra de Base de Datos (Database Seed)
 * ============================================================
 *
 * Este script crea los datos iniciales necesarios para que el
 * sistema funcione correctamente:
 *
 *  1. Usuario administrador raíz del sistema (admin / SUPERADMIN)
 *  2. Presupuestos sectoriales iniciales por módulo productivo
 *
 * Ejecución:
 *  npm run prisma:seed
 *
 * Es SEGURO ejecutarlo múltiples veces (usa upsert = crear o actualizar).
 * Si el usuario 'admin' ya existe, actualiza su contraseña y nombre.
 * Si los presupuestos ya existen, actualiza sus montos.
 *
 * IMPORTANTE: En producción, cambiar la contraseña del admin inmediatamente
 * después del primer deploy desde el panel de administración de SIRESA.
 */

import prisma from '../src/shared/config/db.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Iniciando siembra de base de datos...');

  // ─── Usuario Administrador Principal ──────────────────────────────────────────
  const adminUsername = 'admin';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'admin_nayarit_2026';

  // Hashear la contraseña con bcrypt (costo 12 = balance seguridad/velocidad)
  // La contraseña NUNCA se guarda en texto claro en la base de datos
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // upsert = insertar si no existe, actualizar si ya existe
  const adminUser = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash: passwordHash,
      name: 'Administrador SEDER',
      role: 'SUPERADMIN', // Asegurar rol SUPERADMIN en cada seed
    },
    create: {
      username: adminUsername,
      passwordHash: passwordHash,
      name: 'Administrador SEDER',
      role: 'SUPERADMIN',
    },
  });

  console.log(`✅ Usuario administrador listo:`);
  console.log(`   - Usuario: ${adminUser.username}`);
  console.log(`   - Rol: ${adminUser.role}`);

  // ─── Presupuestos Sectoriales Iniciales ───────────────────────────────────────
  // Estos montos son el presupuesto anual asignado por sector productivo.
  // Se comparan con la inversión real en el dashboard de estadísticas.
  // Los ADMINISTRADORES pueden modificarlos desde la interfaz de SIRESA.
  const presupuestosDefault = [
    { sector: 'AGRICULTURA_FRIJOL', montoAsignado: 2500000 },  // $2.5M para agricultura
    { sector: 'GANADERIA',          montoAsignado: 3000000 },  // $3M para ganadería
    { sector: 'PESCA_ACUACULTURA',  montoAsignado: 2000000 },  // $2M para pesca y acuacultura
    { sector: 'INFRAESTRUCTURA',    montoAsignado: 5000000 },  // $5M para infraestructura rural
    { sector: 'MAQUINARIA',         montoAsignado: 4000000 }   // $4M para maquinaria agrícola
  ];

  for (const item of presupuestosDefault) {
    await prisma.presupuestoSector.upsert({
      where: { sector: item.sector },
      update: { montoAsignado: item.montoAsignado },
      create: {
        sector: item.sector,
        montoAsignado: item.montoAsignado
      }
    });
  }

  console.log(`✅ Presupuestos sectoriales sembrados correctamente.`);
  console.log('✅ Siembra completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra de base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerrar la conexión con la base de datos al terminar
    await prisma.$disconnect();
  });
