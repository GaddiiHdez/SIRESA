/**
 * ============================================================
 * Servicio Centralizado de Bitácora de Auditoría Forense
 * ============================================================
 *
 * Registra de forma inmutable todas las operaciones sensibles del
 * sistema (cambios de presupuesto, creación de expedientes, cambios
 * de estatus, digitalización de documentos, gestión de usuarios, etc.).
 *
 * Se ejecuta de forma asíncrona no bloqueante para no penalizar
 * el tiempo de respuesta del usuario.
 */

import prisma from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Obtiene la dirección IP real del cliente considerando proxies y balanceadores.
 */
function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : null;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

/**
 * Obtiene el User-Agent del cliente.
 */
function getUserAgent(req) {
  if (!req || !req.headers) return null;
  return req.headers['user-agent'] || null;
}

/**
 * Registra una entrada en la bitácora de auditoría.
 *
 * @param {Object} params
 * @param {string} params.accion - Tipo de acción (LOGIN, AJUSTE_PRESUPUESTO, CAMBIO_ESTATUS, etc.)
 * @param {string} params.modulo - Módulo afectado (AUTH, PRESUPUESTOS, SOLICITUDES, USUARIOS, etc.)
 * @param {string} [params.detalles] - Descripción legible del evento
 * @param {Object} [params.valoresAnt] - Estado anterior de los datos modificados
 * @param {Object} [params.valoresNue] - Estado nuevo de los datos
 * @param {Object} [params.req] - Objeto Request de Express (para extraer usuario, IP y User-Agent)
 * @param {string} [params.usuarioId] - ID explícito del usuario si no viene en req
 * @param {string} [params.username] - Username explícito si no viene en req
 * @param {string} [params.userRole] - Rol explícito si no viene en req
 */
export async function registrarAuditoria({
  accion,
  modulo,
  detalles = null,
  valoresAnt = null,
  valoresNue = null,
  req = null,
  usuarioId = null,
  username = null,
  userRole = null
}) {
  try {
    const user = req?.user;
    const finalUserId = usuarioId || user?.id || null;
    const finalUsername = username || user?.username || 'SISTEMA';
    const finalRole = userRole || user?.role || 'SISTEMA';
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Guardar en la base de datos de manera atómica
    await prisma.auditLog.create({
      data: {
        accion,
        modulo,
        detalles,
        valoresAnt: valoresAnt ? JSON.parse(JSON.stringify(valoresAnt)) : undefined,
        valoresNue: valoresNue ? JSON.parse(JSON.stringify(valoresNue)) : undefined,
        usuarioId: finalUserId,
        username: finalUsername,
        userRole: finalRole,
        ipAddress,
        userAgent
      }
    });

    logger.info(`[AUDIT] ${accion} en módulo ${modulo} por @${finalUsername}`, {
      accion,
      modulo,
      username: finalUsername,
      ip: ipAddress
    });
  } catch (error) {
    // Si falla el guardado de auditoría, se registra en logs de winston pero NO se interrumpe la operación principal
    logger.error('Error al guardar registro de auditoría', { error: error.message, accion, modulo });
  }
}
