// Servicio de API — llamadas reales al backend con control de sesión seguro.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ---------- Gestión de token y sesión ----------

export function getToken() {
  return localStorage.getItem('seder_token');
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export function saveSession(token, user) {
  localStorage.setItem('seder_token', token);
  localStorage.setItem('seder_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('seder_token');
  localStorage.removeItem('seder_user');
}

export function getCurrentUser() {
  const token = getToken();
  const raw = localStorage.getItem('seder_user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Helper genérico de verificación de respuesta
async function handleResponse(res, errorMessage = 'Error en la solicitud.') {
  if (res.status === 401) {
    clearSession();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Sesión no autorizada o token expirado. Por favor inicia sesión.');
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('El servidor no respondió en formato JSON. Verifica la variable VITE_API_URL.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || errorMessage);
  }
  return res.json();
}

// ---------- Funciones de API ----------

export async function apiLogin(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('No se pudo conectar al servidor Backend API. Revisa la variable VITE_API_URL en el Frontend.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciales inválidas o error de conexión.');
  }
  const data = await res.json();
  saveSession(data.token, data.user);
  return data;
}

export async function apiGetCatalogos() {
  const res = await fetch(`${API_URL}/catalogos`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al obtener catálogos.');
}

export async function apiGetStats() {
  const res = await fetch(`${API_URL}/solicitudes/stats`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar estadísticas.');
}

export async function apiGetSolicitudes(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/solicitudes?${query}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al listar solicitudes.');
}

export async function apiGetSolicitud(id) {
  const res = await fetch(`${API_URL}/solicitudes/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar detalle de la solicitud.');
}

export async function apiCrearSolicitud(data) {
  const res = await fetch(`${API_URL}/solicitudes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Error al registrar solicitud.');
}

export async function apiActualizarEstatus(id, estatus, comentario) {
  const res = await fetch(`${API_URL}/solicitudes/${id}/estatus`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estatus, comentario })
  });
  return handleResponse(res, 'Error al actualizar estatus.');
}

export async function apiActualizarDocumentos(id, documentos) {
  const res = await fetch(`${API_URL}/solicitudes/${id}/documentos`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ documentos })
  });
  return handleResponse(res, 'Error al actualizar documentos.');
}

export function apiSubirDocumento(file, onProgress) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/upload`);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Respuesta del servidor inválida.'));
        }
      } else if (xhr.status === 401) {
        clearSession();
        window.location.href = '/login';
        reject(new Error('Sesión expirada. Por favor inicie sesión nuevamente.'));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || 'Error al subir archivo.'));
        } catch (e) {
          reject(new Error(`Error en el servidor (${xhr.status}).`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Error de red al intentar subir el archivo.'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export async function apiGetProductores() {
  const res = await fetch(`${API_URL}/solicitudes/productores`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar censo de productores.');
}

export async function apiActualizarPresupuestos(presupuestos) {
  const res = await fetch(`${API_URL}/presupuestos`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ presupuestos })
  });
  return handleResponse(res, 'Error al actualizar presupuestos sectoriales.');
}

export async function apiActualizarPresupuesto(presupuestos) {
  return apiActualizarPresupuestos(presupuestos);
}

// ---------- Gestión de Usuarios (SIRESA Admin) ----------

export async function apiGetUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al consultar la lista de usuarios.');
}

export async function apiCrearUsuario(userData) {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  return handleResponse(res, 'Error al registrar nuevo usuario.');
}

export async function apiActualizarUsuario(id, userData) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  return handleResponse(res, 'Error al actualizar usuario.');
}

export async function apiEliminarUsuario(id) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res, 'Error al eliminar usuario.');
}

