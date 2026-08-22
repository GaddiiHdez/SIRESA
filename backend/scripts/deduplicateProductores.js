/**
 * ============================================================
 * Script de Desduplicación y Consolidación de Productores
 * Secretaría de Desarrollo Rural de Nayarit
 * ============================================================
 *
 * Este script limpia la base de datos PostgreSQL fusionando registros
 * duplicados de un mismo ciudadano u organización (mismo CURP o RFC),
 * vinculando todas sus solicitudes al registro único principal.
 *
 * Ejecución:
 *   node scripts/deduplicateProductores.js
 */

import prisma from '../src/shared/config/db.js';

async function main() {
  console.log('🔍 Iniciando análisis de desduplicación del Padrón de Productores...');

  // 1. Obtener todos los productores con sus solicitudes
  const todosLosProductores = await prisma.productor.findMany({
    include: { solicitudes: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📊 Total de registros de productores actuales en BD: ${todosLosProductores.length}`);

  // 2. Agrupar por CURP (normalizada) o RFC
  const gruposCurp = {};
  const sinIdentificador = [];

  todosLosProductores.forEach((p) => {
    const curpNorm = p.curp?.trim()?.toUpperCase();
    const rfcNorm = p.rfc?.trim()?.toUpperCase();
    const key = curpNorm || rfcNorm;

    if (key && key.length >= 10) {
      if (!gruposCurp[key]) {
        gruposCurp[key] = [];
      }
      gruposCurp[key].push(p);
    } else {
      sinIdentificador.push(p);
    }
  });

  let totalGruposDuplicados = 0;
  let totalSolicitudesRevinculadas = 0;
  let totalProductoresEliminados = 0;

  // 3. Procesar cada grupo con duplicados
  for (const [key, lista] of Object.entries(gruposCurp)) {
    if (lista.length > 1) {
      totalGruposDuplicados++;
      console.log(`\n⚙️ Procesando duplicados para identificador [${key}] (${lista.length} registros encontradas)...`);

      // El principal será el primero (el más reciente o completo)
      const principal = lista[0];
      const duplicados = lista.slice(1);

      const nombrePrincipal = principal.nombreOrganizacion ||
        `${principal.nombre || ''} ${principal.apellidoPaterno || ''} ${principal.apellidoMaterno || ''}`.trim();

      console.log(`   🏆 Perfil Principal Conservado: "${nombrePrincipal}" (ID: ${principal.id})`);

      for (const dup of duplicados) {
        const nombreDup = dup.nombreOrganizacion ||
          `${dup.nombre || ''} ${dup.apellidoPaterno || ''} ${dup.apellidoMaterno || ''}`.trim();

        // Re-vincular todas las solicitudes del duplicado al principal
        const actualizadas = await prisma.solicitud.updateMany({
          where: { productorId: dup.id },
          data: { productorId: principal.id }
        });

        totalSolicitudesRevinculadas += actualizadas.count;
        console.log(`   🔗 Re-vinculadas ${actualizadas.count} solicitudes de "${nombreDup}" (ID: ${dup.id}) -> Principal`);

        // Eliminar el registro duplicado sobrante
        await prisma.productor.delete({
          where: { id: dup.id }
        });
        totalProductoresEliminados++;
      }
    }
  }

  // 4. Reporte final
  const totalUnicosActuales = await prisma.productor.count();

  console.log('\n==================================================');
  console.log('✅ PROCESO DE DESDUPLICACIÓN COMPLETADO CON ÉXITO');
  console.log(` - Grupos con duplicados procesados: ${totalGruposDuplicados}`);
  console.log(` - Solicitudes re-vinculadas: ${totalSolicitudesRevinculadas}`);
  console.log(` - Registros duplicados eliminados: ${totalProductoresEliminados}`);
  console.log(` - Productores ÚNICOS finales en el padrón: ${totalUnicosActuales}`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la desduplicación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
