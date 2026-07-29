import prisma from '../src/shared/config/db.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Iniciando siembra de base de datos...');

  const adminUsername = 'admin';
  const adminPassword = 'admin_nayarit_2026';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash: passwordHash,
      name: 'Administrador SEDER',
      role: 'ADMINISTRADOR',
    },
    create: {
      username: adminUsername,
      passwordHash: passwordHash,
      name: 'Administrador SEDER',
      role: 'ADMINISTRADOR',
    },
  });
  console.log(`Usuario administrador sembrado con éxito (con hash bcrypt):`);
  console.log(`- Usuario: ${adminUser.username}`);

  // Sembrar presupuestos por defecto
  const presupuestosDefault = [
    { sector: 'AGRICULTURA_FRIJOL', montoAsignado: 2500000 },
    { sector: 'GANADERIA', montoAsignado: 3000000 },
    { sector: 'PESCA_ACUACULTURA', montoAsignado: 2000000 },
    { sector: 'INFRAESTRUCTURA', montoAsignado: 5000000 },
    { sector: 'MAQUINARIA', montoAsignado: 4000000 }
  ];

  for (const item of presupuestosDefault) {
    await prisma.presupuestoSector.upsert({
      where: { sector: item.sector },
      update: {
        montoAsignado: item.montoAsignado
      },
      create: {
        sector: item.sector,
        montoAsignado: item.montoAsignado
      }
    });
  }
  console.log('Presupuestos sectoriales sembrados con éxito.');

  console.log('Siembra finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la siembra de base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
