import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SidebarLayout from './shared/layouts/SidebarLayout';
import { getCurrentUser, clearSession } from './shared/services/api';
import './shared/styles/index.css';
import ToastContainer from './shared/components/ToastContainer';

// Lazy loading de páginas principales
const LoginPage = lazy(() => import('./modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const EstadisticasPage = lazy(() => import('./modules/dashboard/pages/EstadisticasPage'));
const NuevaSolicitudPage = lazy(() => import('./modules/solicitudes/pages/NuevaSolicitudPage'));
const ConsultaExpedientesPage = lazy(() => import('./modules/solicitudes/pages/ConsultaExpedientesPage'));
const ProductoresPage = lazy(() => import('./modules/productores/pages/ProductoresPage'));
const ConfiguracionUsuariosPage = lazy(() => import('./modules/admin/pages/ConfiguracionUsuariosPage'));

// Cargador de página estético
function PageLoader() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center flex-col gap-4 animate-pulse">
      <div className="w-10 h-10 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cargando Sección...</span>
    </div>
  );
}

// Wrapper para proteger rutas privadas
function ProtectedRoute({ currentUser, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Wrapper para evitar re-ingreso a login si ya está autenticado
function PublicRoute({ currentUser, children }) {
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    navigate('/');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    navigate('/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900">
        <PageLoader />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <ToastContainer />
      <Routes>
        {/* Ruta pública de login */}
        <Route 
          path="/login" 
          element={
            <PublicRoute currentUser={currentUser}>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </PublicRoute>
          } 
        />

        {/* Rutas protegidas bajo el SidebarLayout */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute currentUser={currentUser}>
              <SidebarLayout currentUser={currentUser} onLogout={handleLogout}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/estadisticas" element={<EstadisticasPage />} />
                    <Route 
                      path="/registrar" 
                      element={
                        currentUser?.role !== 'ANALISTA'
                          ? <NuevaSolicitudPage onSaveSuccess={() => navigate('/consultar')} />
                          : <Navigate to="/" replace />
                      } 
                    />
                    <Route path="/consultar" element={<ConsultaExpedientesPage />} />
                    <Route path="/productores" element={<ProductoresPage />} />
                    <Route 
                      path="/usuarios" 
                      element={
                        currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR'
                          ? <ConfiguracionUsuariosPage />
                          : <Navigate to="/" replace />
                      } 
                    />
                    {/* Fallback de redirección interna */}
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
