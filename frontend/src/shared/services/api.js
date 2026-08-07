/**
 * ============================================================
 * Servicio de API — Capa de Comunicación con el Backend
 * ============================================================
 *
 * Este módulo centraliza TODAS las llamadas HTTP al backend de SIRESA.
 * Los componentes y páginas de React nunca hacen fetch() directamente;
 * siempre usan las funciones exportadas aquí.
 *
 * Beneficios de esta arquitectura:
 *  - Un solo lugar para cambiar la URL base o agregar headers globales
 *  - Manejo automático de token expirado (redirige a /login con 401)
 *  - Validación de que la respuesta sea JSON antes de parsearla
 *  - Mensajes de error descriptivos para el usuario
 *
 * Variables de entorno necesarias:
 *  VITE_API_URL → URL del backend (ej: https://mi-backend.railway.app/api)
 *  Si no está definida, usa http://localhost:5000/api por defecto (desarrollo local)
 */

// URL base de la API, inyectada por Vite desde las variables de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Construye la URL completa de un archivo estático del backend.
 * Convierte rutas relativas (ej: /uploads/file.pdf) en URLs absolutas.
 *
 * @param {string} path - Ruta relativa o URL absoluta del archivo
 * @returns {string} URL completa del archivo
 */
export function getFileUrl(path) {
  if (!path) return '';
  // Si ya es una URL absoluta HTTP(S), verificar si necesita token
  let fullUrl = path;
  if (!path.startsWith('http://') && !path.startsWith('https://')) {
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Si la URL apunta a /uploads/ y el usuario tiene token de sesión, adjuntar ?token= para autenticación estática
  const token = getToken();
  if (token && fullUrl.includes('/uploads/') && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
}

// ─── Gestión de Token y Sesión ─────────────────────────────────────────────────

/**
 * Obtiene el token JWT guardado en localStorage.
 * @returns {string|null} El token o null si no hay sesión activa
 */
export function getToken() {
  return localStorage.getItem('seder_token');
}

/**
 * Construye los headers HTTP para peticiones autenticadas.
 * Incluye Content-Type: application/json y el token Bearer si existe.
 * @returns {Object} Headers para usar en fetch()
 */
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Guarda el token y los datos del usuario en localStorage al iniciar sesión.
 * @param {string} token - Token JWT del servidor
 * @param {Object} user - Datos del usuario ({ id, username, role, name })
 */
export function saveSession(token, user) {
  localStorage.setItem('seder_token', token);
  localStorage.setItem('seder_user', JSON.stringify(user));
}

/**
 * Elimina el token y los datos del usuario de localStorage (cierre de sesión).
 */
export function clearSession() {
  localStorage.removeItem('seder_token');
  localStorage.removeItem('seder_user');
}

/**
 * Obtiene los datos del usuario actualmente autenticado desde localStorage.
 * @returns {Object|null} Datos del usuario o null si no hay sesión activa
 */
export function getCurrentUser() {
  const token = getToken();
  const raw = localStorage.getItem('seder_user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null; // Si los datos están corruptos, tratar como no autenticado
  }
}

// ─── Helper de Respuesta HTTP ──────────────────────────────────────────────────

/**
 * Procesa la respuesta de fetch() con manejo de errores centralizado.
 *
 * Comportamientos:
 *  - 401 Unauthorized → limpia la sesión y redirige a /login automáticamente
 *  - Respuesta no-JSON → lanza error descriptivo (indica problema de configuración)
 *  - Respuesta con error HTTP (4xx, 5xx) → lanza el mensaje de error del backend
 *  - Respuesta exitosa → devuelve el objeto JSON parseado
 *
 * @param {Response} res - Respuesta de fetch()
 * @param {string} errorMessage - Mensaje de error por defecto
 * @returns {Promise<Object>} Datos de la respuesta JSON
 */
async function handleResponse(res, errorMessage = 'Error en la solicitud.') {
  // Token expirado o inválido: mostrar aviso y redirigir a login
  // El SessionExpiryModal del SidebarLayout normalmente intercepta esto antes,
  // pero si el token expiró mientras el sistema estaba inactivo en background,
  // esta es la red de seguridad final.
  if (res.status === 401) {
    clearSession();
    if (window.location.pathname !== '/login') {
      // Disparar evento global para que el ToastContainer lo muestre
      window.dispatchEvent(new CustomEvent('sdr-toast', {
        detail: {
          id: 'session-expired',
          message: '🔒 Tu sesión ha expirado. Inicia sesión de nuevo para continuar.',
          type: 'warning',
          duration: 4000
        }
      }));
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    }
    throw new Error('Sesión no autorizada o token expirado. Por favor inicia sesión.');
  }

  // Verificar que la respuesta sea JSON (evita errores de parseo confusos)
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('El servidor no respondió en formato JSON. Verifica la variable VITE_API_URL.');
  }

  // Error de negocio (400, 403, 404, etc.): extraer mensaje del cuerpo
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || errorMessage);
  }

  return res.json();
}

// ─── Autenticación ─────────────────────────────────────────────────────────────

/**
 * Inicia sesión en el sistema.
 * Si la autenticación es exitosa, guarda el token y los datos del usuario.
 *
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{token, user}>} Token JWT y datos del usuario
 */
export async function apiLogin(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  // Verificar respuesta JSON antes de parsear
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('No se pudo conectar al servidor Backend API. Revisa la variable VITE_API_URL en el Frontend.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciales inválidas o error de conexión.');
  }

  const data = await res.json();
  saveSession(data.token, data.user); // Persistir sesión en localStorage
  return data;
}

// ─── Catálogos ─────────────────────────────────────────────────────────────────

/**
 * Obtiene los catálogos del sistema (municipios, localidades, listas de opciones).
 * @returns {Promise<Object>} Objeto con todos los catálogos del sistema
 */
export async function apiGetCatalogos() {
  const res = await fetch(`${API_URL}/catalogos`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al obtener catálogos.');
}

// ─── Estadísticas ──────────────────────────────────────────────────────────────

/**
 * Obtiene las estadísticas agregadas para el dashboard.
 * Incluye totales, inversión, beneficiarios, distribución por estatus/módulo/municipio.
 * @returns {Promise<Object>} Datos del dashboard
 */
export async function apiGetStats() {
  const res = await fetch(`${API_URL}/solicitudes/stats`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar estadísticas.');
}

// ─── Solicitudes / Expedientes ─────────────────────────────────────────────────

/**
 * Obtiene el listado paginado de expedientes con filtros opcionales.
 * @param {Object} filters - Filtros de búsqueda (folio, status, municipio, etc.)
 * @returns {Promise<Array>} Lista de expedientes
 */
export async function apiGetSolicitudes(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/solicitudes?${query}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al listar solicitudes.');
}

/**
 * Obtiene el detalle completo de un expediente por su ID.
 * @param {string} id - UUID del expediente
 * @returns {Promise<Object>} Datos completos del expediente
 */
export async function apiGetSolicitud(id) {
  const res = await fetch(`${API_URL}/solicitudes/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar detalle de la solicitud.');
}

/**
 * Registra un nuevo expediente de solicitud de apoyo.
 * @param {Object} data - Datos completos del formulario
 * @returns {Promise<Object>} El expediente recién creado
 */
export async function apiCrearSolicitud(data) {
  const res = await fetch(`${API_URL}/solicitudes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Error al registrar solicitud.');
}

/**
 * Cambia el estatus de un expediente en el flujo de trabajo.
 * @param {string} id - UUID del expediente
 * @param {string} estatus - Nuevo estatus (ej: "EN REVISIÓN", "APROBADA")
 * @param {string} comentario - Comentario para el historial
 * @returns {Promise<Object>} El expediente actualizado
 */
export async function apiActualizarEstatus(id, estatus, comentario) {
  const res = await fetch(`${API_URL}/solicitudes/${id}/estatus`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estatus, comentario })
  });
  return handleResponse(res, 'Error al actualizar estatus.');
}

/**
 * Actualiza las URLs de documentos de un expediente.
 * Se llama después de subir los archivos con apiSubirDocumento().
 * @param {string} id - UUID del expediente
 * @param {Object} documentos - URLs de los documentos { ineUrl, curpUrl, etc. }
 * @returns {Promise<Object>} El expediente actualizado
 */
export async function apiActualizarDocumentos(id, documentos) {
  const res = await fetch(`${API_URL}/solicitudes/${id}/documentos`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ documentos })
  });
  return handleResponse(res, 'Error al actualizar documentos.');
}

// ─── Subida de Archivos ────────────────────────────────────────────────────────

/**
 * Sube un archivo (PDF o imagen) al servidor con soporte de progreso.
 *
 * Usa XMLHttpRequest en lugar de fetch() para poder reportar
 * el progreso de la subida mediante el evento onprogress.
 *
 * @param {File} file - El archivo a subir (del input type="file")
 * @param {Function} onProgress - Callback opcional (recibe porcentaje 0-100)
 * @returns {Promise<{success, url, filename, size}>} Resultado de la subida
 */
export function apiSubirDocumento(file, onProgress) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/upload`);

    // Agregar el token de autenticación al header
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Callback de progreso: actualiza la barra de progreso en la UI
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    // Respuesta del servidor
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Subida exitosa
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Respuesta del servidor inválida.'));
        }
      } else if (xhr.status === 401) {
        // Token expirado durante la subida
        clearSession();
        window.location.href = '/login';
        reject(new Error('Sesión expirada. Por favor inicie sesión nuevamente.'));
      } else {
        // Error del servidor (tamaño excedido, tipo no permitido, etc.)
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || 'Error al subir archivo.'));
        } catch (e) {
          reject(new Error(`Error en el servidor (${xhr.status}).`));
        }
      }
    };

    // Error de red (sin conexión, timeout, etc.)
    xhr.onerror = () => reject(new Error('Error de red al intentar subir el archivo.'));

    // Enviar el archivo como multipart/form-data
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

// ─── Productores ───────────────────────────────────────────────────────────────

/**
 * Obtiene el padrón completo de productores con sus solicitudes.
 * @returns {Promise<Array>} Lista de productores
 */
export async function apiGetProductores() {
  const res = await fetch(`${API_URL}/solicitudes/productores`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar censo de productores.');
}

// ─── Presupuestos ──────────────────────────────────────────────────────────────

/**
 * Actualiza los presupuestos sectoriales.
 * @param {Array} presupuestos - Array de { sector, montoAsignado }
 * @returns {Promise<Object>} Resultado de la actualización
 */
export async function apiActualizarPresupuestos(presupuestos) {
  const res = await fetch(`${API_URL}/presupuestos`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ presupuestos })
  });
  return handleResponse(res, 'Error al actualizar presupuestos sectoriales.');
}

/** Alias para compatibilidad con código existente */
export async function apiActualizarPresupuesto(presupuestos) {
  return apiActualizarPresupuestos(presupuestos);
}

// ─── Gestión de Usuarios ───────────────────────────────────────────────────────

/**
 * Obtiene la lista de todos los usuarios del sistema.
 * Solo accesible para SUPERADMIN y ADMINISTRADOR.
 * @returns {Promise<Array>} Lista de usuarios (sin passwordHash)
 */
export async function apiGetUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar la lista de usuarios.');
}

/**
 * Crea un nuevo usuario en el sistema.
 * @param {Object} userData - Datos del usuario { username, password, name, role }
 * @returns {Promise<Object>} El usuario recién creado
 */
export async function apiCrearUsuario(userData) {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  return handleResponse(res, 'Error al registrar nuevo usuario.');
}

/**
 * Actualiza los datos de un usuario existente.
 * @param {string} id - UUID del usuario
 * @param {Object} userData - Datos a actualizar { username?, password?, name?, role? }
 * @returns {Promise<Object>} El usuario actualizado
 */
export async function apiActualizarUsuario(id, userData) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  return handleResponse(res, 'Error al actualizar usuario.');
}

/**
 * Elimina permanentemente un usuario del sistema.
 * @param {string} id - UUID del usuario a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function apiEliminarUsuario(id) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al eliminar usuario.');
}
