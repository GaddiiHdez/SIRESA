/**
 * ============================================================
 * SIRESA — Aplicación React Principal (App.jsx)
 * ============================================================
 *
 * Este es el componente raíz de la aplicación. Define:
 *  - La estructura de rutas con React Router
 *  - El sistema de autenticación a nivel de app
 *  - Rutas públicas (login) y protegidas (dashboard, expedientes, etc.)
 *  - Lazy loading de páginas para optimizar el tiempo de carga inicial
 *
 * Flujo de autenticación:
 *  1. Al cargar, se verifica si hay un token guardado en localStorage
 *  2. Si existe y es válido, el usuario entra directamente al dashboard
 *  3. Si no hay token, se redirige a /login
 *  4. Al hacer logout, se limpia el token y se redirige a /login
 *
 * Rutas del sistema:
 *  /          → Dashboard principal con estadísticas
 *  /estadisticas → Vista de analíticas detalladas
 *  /registrar → Formulario de nuevo expediente (no disponible para ANALISTA)
 *  /consultar → Consulta y búsqueda de expedientes
 *  /productores → Padrón de productores
 *  /usuarios  → Gestión de usuarios (solo SUPERADMIN y ADMINISTRADOR)
 *  /login     → Inicio de sesión
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SidebarLayout from './shared/layouts/SidebarLayout';
import { getCurrentUser, clearSession } from './shared/services/api';
import './shared/styles/index.css';
import ToastContainer from './shared/components/ToastContainer';

// ─── Lazy Loading de Páginas ───────────────────────────────────────────────────
// React.lazy() carga cada página solo cuando el usuario navega a ella.
// Esto reduce el tamaño del bundle inicial y mejora el tiempo de carga (TTI).
const LoginPage                = lazy(() => import('./modules/auth/pages/LoginPage'));
const DashboardPage            = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const EstadisticasPage         = lazy(() => import('./modules/dashboard/pages/EstadisticasPage'));
const NuevaSolicitudPage       = lazy(() => import('./modules/solicitudes/pages/NuevaSolicitudPage'));
const ConsultaExpedientesPage  = lazy(() => import('./modules/solicitudes/pages/ConsultaExpedientesPage'));
const ProductoresPage          = lazy(() => import('./modules/productores/pages/ProductoresPage'));
const ConfiguracionUsuariosPage = lazy(() => import('./modules/admin/pages/ConfiguracionUsuariosPage'));

// ─── Componente de Carga ───────────────────────────────────────────────────────
/**
 * Pantalla de espera que se muestra mientras una página está siendo cargada
 * por el lazy loading o mientras se verifica la sesión al arrancar la app.
 */
function PageLoader() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center flex-col gap-4 animate-pulse">
      <div className="w-10 h-10 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cargando Sección...</span>
    </div>
  );
}

// ─── Guardia de Ruta Privada ───────────────────────────────────────────────────
/**
 * Envuelve rutas que requieren sesión activa.
 * Si el usuario no está autenticado, redirige automáticamente a /login.
 *
 * @param {Object} currentUser - Usuario autenticado o null
 * @param {ReactNode} children - Componente de la ruta protegida
 */
function ProtectedRoute({ currentUser, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ─── Guardia de Ruta Pública ───────────────────────────────────────────────────
/**
 * Envuelve rutas que NO requieren sesión (como /login).
 * Si el usuario ya está autenticado, lo redirige al dashboard
 * para evitar que vea el login innecesariamente.
 *
 * @param {Object} currentUser - Usuario autenticado o null
 * @param {ReactNode} children - Componente de la ruta pública
 */
function PublicRoute({ currentUser, children }) {
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function App() {
  // Estado del usuario autenticado (null = no autenticado)
  const [currentUser, setCurrentUser] = useState(null);

  // Flag para mostrar el loader mientras se verifica la sesión guardada
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();

  // Al montar la app, verificar si hay un token de sesión guardado en localStorage
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user); // Restaurar sesión del usuario
    }
    setCheckingAuth(false); // Dejar de mostrar el loader de verificación
  }, []);

  /**
   * Se llama desde LoginPage cuando el login es exitoso.
   * Guarda el usuario en el estado y navega al dashboard.
   */
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    navigate('/');
  };

  /**
   * Cierra la sesión del usuario:
   * elimina el token de localStorage y limpia el estado.
   */
  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    navigate('/login');
  };

  // Mientras se verifica si hay sesión guardada, mostrar pantalla de carga
  if (checkingAuth) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900">
        <PageLoader />
      </div>
    );
  }

  return (
    // Suspense es el contenedor que muestra PageLoader mientras se carga una página lazy
    <Suspense fallback={<PageLoader />}>
      {/* Sistema de notificaciones toast (mensajes de éxito/error) */}
      <ToastContainer />

      <Routes>
        {/* ── Ruta Pública: Login ──────────────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <PublicRoute currentUser={currentUser}>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </PublicRoute>
          }
        />

        {/* ── Rutas Protegidas: Requieren sesión activa ────────────────────── */}
        {/* Todas se renderizan dentro del SidebarLayout (barra lateral + contenido) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <SidebarLayout currentUser={currentUser} onLogout={handleLogout}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Dashboard principal con métricas y resumen */}
                    <Route path="/" element={<DashboardPage />} />

                    {/* Vista de estadísticas y gráficas detalladas */}
                    <Route path="/estadisticas" element={<EstadisticasPage />} />

                    {/* Registro de nuevo expediente — bloqueado para rol ANALISTA */}
                    <Route
                      path="/registrar"
                      element={
                        currentUser?.role !== 'ANALISTA'
                          ? <NuevaSolicitudPage onSaveSuccess={() => navigate('/consultar')} />
                          : <Navigate to="/" replace /> // Redirigir si no tiene permiso
                      }
                    />

                    {/* Consulta y búsqueda de expedientes */}
                    <Route path="/consultar" element={<ConsultaExpedientesPage />} />

                    {/* Padrón de productores con mapa de Nayarit */}
                    <Route path="/productores" element={<ProductoresPage />} />

                    {/* Gestión de usuarios — solo SUPERADMIN y ADMINISTRADOR */}
                    <Route
                      path="/usuarios"
                      element={
                        currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR'
                          ? <ConfiguracionUsuariosPage />
                          : <Navigate to="/" replace /> // Redirigir si no tiene permiso
                      }
                    />

                    {/* Fallback: cualquier ruta interna desconocida → dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
