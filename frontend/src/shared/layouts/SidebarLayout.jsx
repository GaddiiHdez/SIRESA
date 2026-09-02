import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, FileSpreadsheet, PlusCircle, LogOut, ShieldCheck, User, Menu, ChevronLeft, Sparkles, X, Users, PieChart, Search, Compass, ShieldAlert, Landmark } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatModulo } from '../utils/formatters';
import { getSectorIcon } from '../config/sectoresMetadata';
import BuscadorNavbar from '../components/BuscadorNavbar';
import CentroNotificacionesMenu from '../components/CentroNotificacionesMenu';
import ExpedienteDetalleModal from '../../modules/solicitudes/components/ExpedienteDetalleModal';
import { apiGetSolicitud, apiActualizarEstatus } from '../services/api';
import { toast } from '../utils/toast';
import { useSessionExpiry } from '../hooks/useSessionExpiry';
import SessionExpiryModal from '../components/SessionExpiryModal';
import ConfirmarSalidaModal from '../components/ConfirmarSalidaModal';
import BuscadorOmniboxModal from '../components/BuscadorOmniboxModal';

export default function SidebarLayout({ currentUser, onLogout, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [showOmnibox, setShowOmnibox] = useState(false);

  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [newEstatus, setNewEstatus] = useState('');
  const [estatusComentario, setEstatusComentario] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // ── Manejo de Confirmación al Abandonar Solicitud en Curso ─────────────────
  const [showConfirmExitModal, setShowConfirmExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // ── Manejo de expiración de sesión ────────────────────────────────────────
  // El hook monitorea el token JWT y activa el modal cuando está por expirar o ya expiró
  const { sessionState, minutesLeft, dismissWarning } = useSessionExpiry(onLogout);

  // Cuando el usuario renueva la sesión exitosamente desde el modal,
  // actualiza los datos del usuario en el estado padre
  const handleSessionRenewed = (newUser) => {
    toast.success(`✅ Sesión renovada. Bienvenido de nuevo, ${newUser.name?.split(' ')[0] || newUser.username}.`, 5000);
    dismissWarning();
  };

  const [captureState, setCaptureState] = useState({
    active: false,
    moduloTipo: '',
    label: 'SDR NAYARIT',
    title: 'SISTEMA DE GESTIÓN',
    iconKey: 'DASHBOARD',
    actions: []
  });

  // Navegación Segura: Bloquea y pide confirmación si hay captura activa
  const safeNavigate = (targetPath) => {
    if (targetPath === currentPath) return;
    if (captureState.active && currentPath === '/registrar') {
      setPendingNavigation(targetPath);
      setShowConfirmExitModal(true);
    } else {
      navigate(targetPath);
    }
  };

  // Cerrar Sesión Segura: Advierte si hay captura activa
  const handleSafeLogout = () => {
    if (captureState.active && currentPath === '/registrar') {
      setPendingNavigation('LOGOUT');
      setShowConfirmExitModal(true);
    } else {
      onLogout();
    }
  };

  const handleConfirmSaveAndExit = () => {
    window.dispatchEvent(new CustomEvent('sdr-solicitud-guardar-borrador'));
    setShowConfirmExitModal(false);
    toast.success('Borrador guardado. Podrás retomarlo cuando regreses a Nueva Solicitud.', 4000);
    if (pendingNavigation === 'LOGOUT') {
      onLogout();
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const handleConfirmStay = () => {
    setShowConfirmExitModal(false);
    setPendingNavigation(null);
  };

  const handleConfirmDiscardAndExit = () => {
    window.dispatchEvent(new CustomEvent('sdr-solicitud-descartar-borrador'));
    try {
      localStorage.removeItem('siresa_solicitud_draft');
    } catch (e) {}
    setShowConfirmExitModal(false);
    toast.info('Borrador descartado.');
    if (pendingNavigation === 'LOGOUT') {
      onLogout();
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowOmnibox(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenDetail = async (solId) => {
    try {
      const detail = await apiGetSolicitud(solId);
      setSelectedSolicitud(detail);
      setNewEstatus(detail.status);
      setEstatusComentario('');
    } catch (error) {
      console.error("Error al abrir expediente desde Navbar/Omnibox:", error);
      toast.error("Error al cargar el expediente.");
    }
  };

  const handleUpdateEstatus = async (e) => {
    e.preventDefault();
    if (!newEstatus) return;

    setUpdateLoading(true);
    try {
      const updated = await apiActualizarEstatus(selectedSolicitud.id, newEstatus, estatusComentario);
      setSelectedSolicitud(updated);
      toast.success("Estatus del expediente actualizado con éxito.");
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      toast.error("Error al actualizar estatus.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const ROUTE_NAVBAR_CONFIG = {
    '/': {
      label: 'SDR NAYARIT',
      title: 'MESA DE CONTROL Y DICTAMEN',
      subtitle: 'Seguimiento operativo y trámites de apoyo',
      iconKey: 'DASHBOARD',
      active: false
    },
    '/estadisticas': {
      label: 'ANALÍTICA ESTRATÉGICA',
      title: 'ESTADÍSTICAS Y ANÁLISIS FINANCIERO',
      subtitle: 'Métricas de inversión y cobertura estatal',
      iconKey: 'ESTADISTICAS',
      active: false
    },
    '/registrar': {
      label: 'SDR NAYARIT',
      title: 'NUEVA SOLICITUD DE APOYO',
      subtitle: 'Registro y captura de expediente',
      iconKey: 'REGISTRO',
      active: false
    },

    '/consultar': {
      label: 'SDR NAYARIT',
      title: 'CONSULTA DE EXPEDIENTES',
      subtitle: 'Padrón y seguimiento de solicitudes',
      iconKey: 'CONSULTA',
      active: false
    },
    '/productores': {
      label: 'SDR NAYARIT',
      title: 'PADRÓN DE PRODUCTORES',
      subtitle: 'Directorio de productores y colectivos rurales',
      iconKey: 'PRODUCTORES',
      active: false
    },
    '/directorio': {
      label: 'SDR NAYARIT',
      title: 'GEODIRECTORIO RURAL',
      subtitle: 'Mapa interactivo y distribución geográfica',
      iconKey: 'DIRECTORIO',
      active: false
    },
    '/reportes': {
      label: 'SDR NAYARIT',
      title: 'REPORTES EJECUTIVOS DE INVERSIÓN',
      subtitle: 'Cédula oficial e informe presupuestal por sector',
      iconKey: 'REPORTES',
      active: false
    },
    '/bitacora': {
      label: 'SEGURIDAD Y CONTROL',
      title: 'BITÁCORA DE AUDITORÍA',
      subtitle: 'Registro de trazabilidad y eventos del sistema',
      iconKey: 'BITACORA',
      active: false
    },
    '/usuarios': {
      label: 'ADMINISTRACIÓN',
      title: 'GESTIÓN DE USUARIOS',
      subtitle: 'Control de cuentas y asignación de roles',
      iconKey: 'USUARIOS',
      active: false
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    const config = ROUTE_NAVBAR_CONFIG[currentPath];
    if (config) {
      setCaptureState(prev => ({
        ...prev,
        ...config,
        actions: []
      }));
    }
  }, [currentPath]);


  useEffect(() => {
    const handleNavbarUpdate = (e) => {
      setCaptureState(prev => ({
        ...prev,
        ...e.detail
      }));
    };
    window.addEventListener('sdr-navbar-update', handleNavbarUpdate);
    return () => {
      window.removeEventListener('sdr-navbar-update', handleNavbarUpdate);
    };
  }, []);

  let IconComponent = ShieldCheck;
  if (captureState.iconKey === 'DASHBOARD') IconComponent = LayoutDashboard;
  else if (captureState.iconKey === 'CONSULTA') IconComponent = FileSpreadsheet;
  else if (captureState.iconKey === 'REGISTRO') IconComponent = PlusCircle;
  else if (captureState.iconKey === 'ESTADISTICAS') IconComponent = PieChart;
  else if (captureState.iconKey === 'PRODUCTORES') IconComponent = Users;
  else if (captureState.iconKey === 'DIRECTORIO') IconComponent = Compass;
  else if (captureState.iconKey === 'REPORTES') IconComponent = Landmark;
  else if (captureState.iconKey === 'BITACORA') IconComponent = ShieldAlert;
  else if (captureState.iconKey === 'USUARIOS') IconComponent = ShieldCheck;
  else if (captureState.iconKey) IconComponent = getSectorIcon(captureState.iconKey) || ShieldCheck;


  return (
    <div className="h-screen w-screen flex bg-nayarit-light text-slate-700 overflow-hidden print:h-auto print:w-full print:overflow-visible print:block print:bg-white">

      {/* ── Modal de Expiración / Aviso de Sesión ──────────────────────────── */}
      <SessionExpiryModal
        sessionState={sessionState}
        minutesLeft={minutesLeft}
        currentUser={currentUser}
        onRenewed={handleSessionRenewed}
        onLogout={onLogout}
        onDismiss={sessionState === 'warning' ? dismissWarning : undefined}
      />

      {/* ── Modal de Advertencia al Abandonar Solicitud en Curso ───────────── */}
      <ConfirmarSalidaModal
        isOpen={showConfirmExitModal}
        moduloTitulo={captureState.title}
        onSaveAndExit={handleConfirmSaveAndExit}
        onStay={handleConfirmStay}
        onDiscardAndExit={handleConfirmDiscardAndExit}
      />

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside 
        className={`print:hidden bg-gradient-to-b from-[#5E1232] via-[#480c25] to-[#200210] text-white flex flex-col justify-between shrink-0 p-4 shadow-xl hidden md:flex relative overflow-hidden h-full transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Línea dorada superior decorativa */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-nayarit-gold via-[#e3b868] to-nayarit-lightGreen" />
        
        <div className="space-y-8">
          {/* ISOLOGO / ISOTIPO SIRESA Y BOTÓN DE COLAPSO */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between pt-1 px-1 animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Emblema Isotipo 1:1 */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C29A52] via-[#dfb96f] to-[#8C6D32] p-[1.5px] shadow-lg shadow-black/25 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-b from-[#4A0A24] to-[#250311] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent pointer-events-none" />
                    <span className="font-black text-base text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-300 font-sans tracking-tighter">
                      S
                    </span>
                  </div>
                </div>

                {/* Tipografía de Marca Institucional */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-wider text-white font-sans leading-none">
                      SIRESA
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.25 bg-[#C29A52]/25 text-amber-300 border border-[#C29A52]/40 rounded-md tracking-tight leading-none">
                      v1.3.0
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-200/80 font-semibold uppercase tracking-widest leading-none mt-1 truncate">
                    Desarrollo Rural
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setIsCollapsed(true)} 
                className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-smooth cursor-pointer shrink-0"
                title="Contraer menú"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 pt-1">
              {/* Isotipo 1:1 en modo colapsado */}
              <div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C29A52] via-[#dfb96f] to-[#8C6D32] p-[1.5px] shadow-lg shadow-black/30 shrink-0 flex items-center justify-center cursor-pointer group"
                onClick={() => setIsCollapsed(false)}
                title="SIRESA — Expandir menú"
              >
                <div className="w-full h-full bg-gradient-to-b from-[#4A0A24] to-[#250311] group-hover:from-[#5d0e2f] group-hover:to-[#330419] rounded-[10px] flex items-center justify-center transition-smooth relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent pointer-events-none" />
                  <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-300 font-sans tracking-tighter">
                    S
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setIsCollapsed(false)} 
                className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-smooth cursor-pointer"
                title="Expandir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="space-y-1.5">
            {!isCollapsed ? (
              // Modo Extendido
              <>
                <button
                  onClick={() => safeNavigate('/')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <LayoutDashboard className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span className="whitespace-nowrap truncate">Mesa de Control</span>
                </button>
                <button
                  onClick={() => safeNavigate('/estadisticas')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/estadisticas'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <PieChart className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/estadisticas' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span className="whitespace-nowrap truncate">Estadísticas y Análisis</span>
                </button>
                {currentUser?.role !== 'ANALISTA' && (
                  <button
                    onClick={() => safeNavigate('/registrar')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                      currentPath === '/registrar'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <PlusCircle className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/registrar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                    <span className="whitespace-nowrap truncate">Nueva Solicitud</span>
                  </button>
                )}
                <button
                  onClick={() => safeNavigate('/consultar')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/consultar'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <FileSpreadsheet className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/consultar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span className="whitespace-nowrap truncate">Buscar Expedientes</span>
                </button>
                <button
                  onClick={() => safeNavigate('/productores')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/productores'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Users className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/productores' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span className="whitespace-nowrap truncate">Padrón de Productores</span>
                </button>
                <button
                  onClick={() => safeNavigate('/directorio')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/directorio'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Compass className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/directorio' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span className="whitespace-nowrap truncate">Geodirectorio Rural</span>
                </button>
                <button
                  onClick={() => safeNavigate('/reportes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/reportes'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Landmark className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/reportes' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span className="whitespace-nowrap truncate">Reportes Ejecutivos</span>
                </button>
                {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => safeNavigate('/usuarios')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                      currentPath === '/usuarios'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <ShieldCheck className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/usuarios' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                    <span className="whitespace-nowrap truncate">Gestión de Usuarios</span>
                  </button>
                )}
                {currentUser?.role === 'SUPERADMIN' && (
                  <button
                    onClick={() => safeNavigate('/bitacora')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-smooth border-l-4 ${
                      currentPath === '/bitacora'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <ShieldAlert className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/bitacora' ? 'text-amber-400' : 'text-slate-300'}`} />
                    <span className="whitespace-nowrap truncate">Bitácora de Auditoría</span>
                  </button>
                )}
              </>

            ) : (
              // Modo Contraído (Solo Iconos con Tooltips nativos)
              <div className="flex flex-col items-center gap-2 animate-fadeIn">
                <button
                  onClick={() => safeNavigate('/')}
                  title="Mesa de Control"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <LayoutDashboard className={`w-5 h-5 ${currentPath === '/' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                <button
                  onClick={() => safeNavigate('/estadisticas')}
                  title="Estadísticas y Análisis"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/estadisticas'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <PieChart className={`w-5 h-5 ${currentPath === '/estadisticas' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                {currentUser?.role !== 'ANALISTA' && (
                  <button
                    onClick={() => safeNavigate('/registrar')}
                    title="Nueva Solicitud"
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                      currentPath === '/registrar'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <PlusCircle className={`w-5 h-5 ${currentPath === '/registrar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  </button>
                )}
                 <button
                  onClick={() => safeNavigate('/consultar')}
                  title="Buscar Expedientes"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/consultar'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${currentPath === '/consultar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                <button
                  onClick={() => safeNavigate('/productores')}
                  title="Padrón de Productores"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/productores'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Users className={`w-5 h-5 ${currentPath === '/productores' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                <button
                  onClick={() => safeNavigate('/directorio')}
                  title="Geodirectorio Rural"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/directorio'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Compass className={`w-5 h-5 ${currentPath === '/directorio' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                <button
                  onClick={() => safeNavigate('/reportes')}
                  title="Reportes Ejecutivos"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/reportes'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Landmark className={`w-5 h-5 ${currentPath === '/reportes' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => safeNavigate('/usuarios')}
                    title="Gestión de Usuarios"
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                      currentPath === '/usuarios'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <ShieldCheck className={`w-5 h-5 ${currentPath === '/usuarios' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  </button>
                )}
                {currentUser?.role === 'SUPERADMIN' && (
                  <button
                    onClick={() => safeNavigate('/bitacora')}
                    title="Bitácora de Auditoría Forense"
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                      currentPath === '/bitacora'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <ShieldAlert className={`w-5 h-5 ${currentPath === '/bitacora' ? 'text-amber-400' : 'text-slate-300'}`} />
                  </button>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* PANEL DE USUARIO (FIJO SIEMPRE ABAJO) */}
        <div className="border-t border-white/10 pt-4 pb-2 space-y-4">
          {!isCollapsed ? (
            // Usuario en modo extendido
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-nayarit-lightGold shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs truncate">{currentUser.name}</div>
                  <span className="text-[9px] bg-nayarit-gold/20 text-nayarit-lightGold px-1.5 py-0.5 rounded-full border border-nayarit-gold/30 font-semibold tracking-wider uppercase inline-block mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSafeLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/20 hover:text-red-200 transition-smooth border border-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            // Usuario en modo colapsado
            <div className="flex flex-col items-center gap-3.5 animate-fadeIn">
              <div 
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-nayarit-lightGold cursor-pointer"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                <User className="w-5 h-5" />
              </div>
              <button
                onClick={handleSafeLogout}
                title="Cerrar Sesión"
                className="w-12 h-12 flex items-center justify-center rounded-xl text-red-300 hover:bg-red-950/20 hover:text-red-200 transition-smooth border border-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── DRAWER LATERAL MÓVIL DESLIZABLE (OFF-CANVAS) ────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[2000] flex md:hidden animate-fadeIn">
          {/* Backdrop con desenfoque */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
          />

          {/* Panel Deslizable */}
          <div className="relative w-72 max-w-[85vw] h-full bg-gradient-to-b from-[#5E1232] via-[#480c25] to-[#200210] text-white flex flex-col justify-between shadow-2xl p-4 overflow-y-auto z-10 animate-slideRight">
            {/* Franja dorada superior */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-nayarit-gold via-[#e3b868] to-nayarit-lightGreen" />

            <div className="space-y-6 pt-2">
              {/* Encabezado del menú móvil */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C29A52] via-[#dfb96f] to-[#8C6D32] p-[1.5px] shadow-sm flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-b from-[#4A0A24] to-[#250311] rounded-[10px] flex items-center justify-center">
                      <span className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200">S</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white tracking-wider">SIRESA</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.25 bg-[#C29A52]/25 text-amber-300 border border-[#C29A52]/40 rounded">v1.3.0</span>
                    </div>
                    <span className="text-[9px] text-amber-200/80 font-semibold uppercase tracking-widest block">Desarrollo Rural</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lista completa de navegación móvil */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => { safeNavigate('/'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                    currentPath === '/'
                      ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                      : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentPath === '/' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span>Mesa de Control</span>
                </button>

                <button
                  onClick={() => { safeNavigate('/estadisticas'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                    currentPath === '/estadisticas'
                      ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                      : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                  }`}
                >
                  <PieChart className={`w-4 h-4 shrink-0 ${currentPath === '/estadisticas' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span>Estadísticas y Análisis</span>
                </button>

                {currentUser?.role !== 'ANALISTA' && (
                  <button
                    onClick={() => { safeNavigate('/registrar'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                      currentPath === '/registrar'
                        ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                        : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                    }`}
                  >
                    <PlusCircle className={`w-4 h-4 shrink-0 ${currentPath === '/registrar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                    <span>Nueva Solicitud</span>
                  </button>
                )}

                <button
                  onClick={() => { safeNavigate('/consultar'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                    currentPath === '/consultar'
                      ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                      : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                  }`}
                >
                  <FileSpreadsheet className={`w-4 h-4 shrink-0 ${currentPath === '/consultar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span>Buscar Expedientes</span>
                </button>

                <button
                  onClick={() => { safeNavigate('/productores'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                    currentPath === '/productores'
                      ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                      : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                  }`}
                >
                  <Users className={`w-4 h-4 shrink-0 ${currentPath === '/productores' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span>Padrón de Productores</span>
                </button>

                <button
                  onClick={() => { safeNavigate('/directorio'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                    currentPath === '/directorio'
                      ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                      : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                  }`}
                >
                  <Compass className={`w-4 h-4 shrink-0 ${currentPath === '/directorio' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span>Geodirectorio Rural</span>
                </button>

                <button
                  onClick={() => { safeNavigate('/reportes'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                    currentPath === '/reportes'
                      ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                      : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                  }`}
                >
                  <Landmark className={`w-4 h-4 shrink-0 ${currentPath === '/reportes' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  <span>Reportes Ejecutivos</span>
                </button>

                {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => { safeNavigate('/usuarios'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                      currentPath === '/usuarios'
                        ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                        : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${currentPath === '/usuarios' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                    <span>Gestión de Usuarios</span>
                  </button>
                )}

                {currentUser?.role === 'SUPERADMIN' && (
                  <button
                    onClick={() => { safeNavigate('/bitacora'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border-l-4 ${
                      currentPath === '/bitacora'
                        ? 'bg-white/15 text-white border-l-nayarit-gold font-bold'
                        : 'hover:bg-white/5 text-slate-300 border-l-transparent'
                    }`}
                  >
                    <ShieldAlert className={`w-4 h-4 shrink-0 ${currentPath === '/bitacora' ? 'text-amber-400' : 'text-slate-300'}`} />
                    <span>Bitácora de Auditoría</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Pie del Drawer Móvil: Perfil y Salida */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2.5 px-1">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-nayarit-lightGold shrink-0">
                  <User size={16} />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="font-bold text-xs truncate text-white">{currentUser?.name}</div>
                  <span className="text-[8px] bg-nayarit-gold/20 text-nayarit-lightGold px-1.5 py-0.25 rounded border border-nayarit-gold/30 font-semibold tracking-wider uppercase inline-block">
                    {currentUser?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setMobileMenuOpen(false); handleSafeLogout(); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/30 hover:text-red-200 transition-colors border border-red-500/20 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible print:block print:w-full">
        
        {/* NAV SUPERIOR MÓVIL (COMPACTO Y FUNCIONAL) */}
        <header className="print:hidden md:hidden bg-[#5E1232] text-white px-3 py-2.5 flex items-center justify-between shadow-md shrink-0 border-b border-[#4A0A24] z-20">
          {/* Lado izquierdo: Botón Menú Hamburguesa + Isotipo + Título */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu size={20} />
            </button>

            <div className="bg-white p-1 rounded-lg shrink-0">
              <img src="/logo-sdr.png" alt="SDR Nayarit" className="h-5 w-auto object-contain" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-xs tracking-tight uppercase truncate">
                {captureState.title}
              </h2>
            </div>
          </div>

          {/* Lado derecho: Búsqueda, Notificaciones o Acciones de Captura */}
          <div className="flex items-center gap-1.5 shrink-0">
            {captureState.actions && captureState.actions.length > 0 ? (
              <div className="flex items-center gap-1.5">
                {captureState.actions.filter(a => a.id === 'cancelar' || a.id === 'navigate-registrar').map(act => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      if (act.id === 'navigate-registrar') safeNavigate('/registrar');
                      else if (act.id === 'navigate-consultar') safeNavigate('/consultar');
                      else window.dispatchEvent(new CustomEvent(`sdr-navbar-action-${act.id}`));
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                      act.id === 'cancelar' ? 'bg-red-500/20 border border-red-500/30 text-red-200' : 'bg-white/10 text-white'
                    }`}
                  >
                    {act.text.split(' ')[0]}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Botón Omnibox Buscador Rápido Móvil */}
                <button
                  onClick={() => setShowOmnibox(true)}
                  className="p-1.5 hover:bg-white/10 text-white/90 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Buscar expedientes (Ctrl+K)"
                  aria-label="Buscar expedientes"
                >
                  <Search size={16} />
                </button>

                {/* Notificaciones Móvil */}
                <div className="text-slate-800">
                  <CentroNotificacionesMenu onSelectSolicitud={(sol) => setSelectedSolicitud(sol)} />
                </div>
              </>
            )}
          </div>
        </header>

        {/* NAV BAR SUPERIOR (DESKTOP) */}
        <header className="print:hidden hidden md:flex items-center justify-between px-4 lg:px-6 py-2.5 bg-white border-b border-slate-200 shrink-0 shadow-xs text-slate-800 transition-all duration-300 relative z-30 min-w-0">
          <div className="flex items-center gap-2.5 lg:gap-3.5 min-w-0 mr-2 shrink">
            <img 
              src="/logo-sdr.png" 
              alt="Secretaría de Desarrollo Rural Nayarit" 
              className="h-8 lg:h-9 w-auto object-contain shrink-0" 
            />
            <div className="h-6 w-[1px] bg-slate-200 shrink-0 hidden sm:block" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-slate-100 rounded-lg text-[#5E1232] border border-slate-200 flex items-center justify-center shrink-0">
                {IconComponent && <IconComponent className="w-4 h-4 lg:w-5 lg:h-5" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm lg:text-base font-bold text-slate-900 tracking-tight leading-tight uppercase truncate">
                  {captureState.title}
                </h1>
                <p className="text-[10px] lg:text-[11px] text-slate-500 font-medium tracking-normal truncate hidden sm:block">
                  {captureState.subtitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Buscador Omnibox Global */}
            <BuscadorNavbar onSelectSolicitud={(sol) => setSelectedSolicitud(sol)} />

            {/* Centro de Notificaciones Inteligente */}
            <CentroNotificacionesMenu onSelectSolicitud={(sol) => setSelectedSolicitud(sol)} />

            {/* Acciones dinámicas de cada módulo */}
            {captureState.actions && captureState.actions.map(act => {
              if (act.id === 'rellenar') {
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('sdr-navbar-action-rellenar'))}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-[11px] font-bold transition-smooth cursor-pointer shadow-2xs uppercase tracking-wider font-extrabold"
                    title="Rellenar datos de prueba para desarrollo"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    {act.text}
                  </button>
                );
              }
              if (act.id === 'cancelar') {
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('sdr-navbar-action-cancelar'))}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-[11px] font-bold transition-smooth cursor-pointer shadow-2xs uppercase tracking-wider font-extrabold"
                  >
                    <X className="w-3.5 h-3.5" />
                    {act.text}
                  </button>
                );
              }
              // Acción Genérica
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent(`sdr-navbar-action-${act.id}`))}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-smooth shadow-2xs cursor-pointer uppercase tracking-wider font-extrabold"
                >
                  {act.text}
                </button>
              );
            })}
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 md:p-6 w-full pb-24 md:pb-6 print:p-0 print:m-0 print:overflow-visible print:h-auto print:block">
          {children}
        </main>

        {/* NAVEGACIÓN MÓVIL INFERIOR FIJA (BOTTOM TAB BAR TIPO APP) */}
        <nav className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-1.5 px-1 shadow-lg">
          <button
            onClick={() => safeNavigate('/')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition-colors ${
              currentPath === '/' ? 'text-[#5E1232]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Inicio</span>
          </button>

          {currentUser?.role !== 'ANALISTA' && (
            <button
              onClick={() => safeNavigate('/registrar')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition-colors ${
                currentPath === '/registrar' ? 'text-[#5E1232]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>Nueva</span>
            </button>
          )}

          <button
            onClick={() => safeNavigate('/consultar')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition-colors ${
              currentPath === '/consultar' ? 'text-[#5E1232]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5" />
            <span>Trámites</span>
          </button>

          <button
            onClick={() => safeNavigate('/productores')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition-colors ${
              currentPath === '/productores' ? 'text-[#5E1232]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Productores</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold text-slate-500 hover:text-[#5E1232] transition-colors cursor-pointer"
          >
            <Menu className="w-4.5 h-4.5" />
            <span>Menú</span>
          </button>
        </nav>
      </div>

      {/* MODAL BUSCADOR OMNIBOX GLOBAL (MÓVIL Y ESCRITORIO CON CTRL+K) */}
      <BuscadorOmniboxModal
        isOpen={showOmnibox}
        onClose={() => setShowOmnibox(false)}
        onSelectExpediente={(solId) => {
          handleOpenDetail(solId);
          setShowOmnibox(false);
        }}
      />

      {/* MODAL DETALLE DE EXPEDIENTE GLOBAL DESDE NAVBAR / NOTIFICACIONES */}
      {selectedSolicitud && (
        <ExpedienteDetalleModal

          selectedSolicitud={selectedSolicitud}
          setSelectedSolicitud={setSelectedSolicitud}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          handleUpdateEstatus={handleUpdateEstatus}
        />
      )}
    </div>
  );
}
