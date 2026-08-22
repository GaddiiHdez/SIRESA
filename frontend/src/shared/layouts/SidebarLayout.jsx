import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, FileSpreadsheet, PlusCircle, LogOut, ShieldCheck, User, Menu, ChevronLeft, Sparkles, X, Users, PieChart, Search, Compass } from 'lucide-react';
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

export default function SidebarLayout({ currentUser, onLogout, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [showOmnibox, setShowOmnibox] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [newEstatus, setNewEstatus] = useState('');
  const [estatusComentario, setEstatusComentario] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // ── Manejo de expiración de sesión ────────────────────────────────────────
  // El hook monitorea el token JWT y activa el modal cuando está por expirar o ya expiró
  const { sessionState, minutesLeft, dismissWarning } = useSessionExpiry(onLogout);

  // Cuando el usuario renueva la sesión exitosamente desde el modal,
  // actualiza los datos del usuario en el estado padre
  const handleSessionRenewed = (newUser) => {
    toast.success(`✅ Sesión renovada. Bienvenido de nuevo, ${newUser.name?.split(' ')[0] || newUser.username}.`, 5000);
    dismissWarning();
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

  const [captureState, setCaptureState] = useState({
    active: false,
    moduloTipo: '',
    label: 'SDR NAYARIT',
    title: 'SISTEMA DE GESTIÓN',
    iconKey: 'DASHBOARD',
    actions: []
  });

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
  if (captureState.iconKey === 'DASHBOARD') IconComponent = BarChart3;
  else if (captureState.iconKey === 'CONSULTA') IconComponent = FileSpreadsheet;
  else if (captureState.iconKey === 'REGISTRO') IconComponent = PlusCircle;
  else if (captureState.iconKey) IconComponent = getSectorIcon(captureState.iconKey);

  return (
    <div className="h-screen w-screen flex bg-nayarit-light text-slate-700 overflow-hidden">

      {/* ── Modal de Expiración / Aviso de Sesión ────────────────────────────
          Se muestra automáticamente cuando:
          - sessionState='warning': la sesión expira en menos de 10 minutos
          - sessionState='expired': el token ya expiró
          En modo 'active' no renderiza nada. */}
      <SessionExpiryModal
        sessionState={sessionState}
        minutesLeft={minutesLeft}
        currentUser={currentUser}
        onRenewed={handleSessionRenewed}
        onLogout={onLogout}
        onDismiss={sessionState === 'warning' ? dismissWarning : undefined}
      />

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside 
        className={`bg-gradient-to-b from-[#5E1232] via-[#480c25] to-[#200210] text-white flex flex-col justify-between shrink-0 p-4 shadow-xl hidden md:flex relative overflow-hidden h-full transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Línea dorada superior decorativa */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-nayarit-gold via-[#e3b868] to-nayarit-lightGreen" />
        
        <div className="space-y-8">
          {/* LOGOTIPO Y BOTÓN DE COLAPSO */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between pt-2 px-1 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-md border border-white/20 shrink-0">
                  <img 
                    src="/logo-sdr.png" 
                    alt="Logo Institucional SDR Nayarit" 
                    className="h-7 w-auto object-contain"
                  />
                </div>
              </div>
              <button 
                onClick={() => setIsCollapsed(true)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth"
                title="Contraer menú"
              >
                <ChevronLeft className="w-4.5 h-4.5 text-slate-300" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="bg-white p-1.5 rounded-xl shadow-md border border-white/20 shrink-0">
                <img 
                  src="/logo-sdr.png" 
                  alt="Logo SDR" 
                  className="h-6 w-auto object-contain"
                />
              </div>
              <button 
                onClick={() => setIsCollapsed(false)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth"
                title="Expandir menú"
              >
                <Menu className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          )}

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="space-y-2">
            {!isCollapsed ? (
              // Modo Extendido
              <>
                <button
                  onClick={() => navigate('/')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <LayoutDashboard className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  Mesa de Control
                </button>
                <button
                  onClick={() => navigate('/estadisticas')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/estadisticas'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <PieChart className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/estadisticas' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  Estadísticas y Análisis
                </button>
                {currentUser?.role !== 'ANALISTA' && (
                  <button
                    onClick={() => navigate('/registrar')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                      currentPath === '/registrar'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <PlusCircle className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/registrar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                    Nueva Solicitud
                  </button>
                )}
                <button
                  onClick={() => navigate('/consultar')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/consultar'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <FileSpreadsheet className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/consultar' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  Buscar Expedientes
                </button>
                <button
                  onClick={() => navigate('/productores')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/productores'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Users className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/productores' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  Padrón de Productores
                </button>
                <button
                  onClick={() => navigate('/directorio')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                    currentPath === '/directorio'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Compass className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/directorio' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                  Geodirectorio Rural
                </button>
                {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => navigate('/usuarios')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-smooth border-l-4 ${
                      currentPath === '/usuarios'
                        ? 'bg-gradient-to-r from-[#C29A52]/35 via-[#C29A52]/10 to-transparent text-white border-l-nayarit-gold shadow-sm'
                        : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                    }`}
                  >
                    <ShieldCheck className={`w-4.5 h-4.5 shrink-0 ${currentPath === '/usuarios' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                    Gestión de Usuarios
                  </button>
                )}
              </>
            ) : (
              // Modo Contraído (Solo Iconos con Tooltips nativos)
              <div className="flex flex-col items-center gap-2 animate-fadeIn">
                <button
                  onClick={() => navigate('/')}
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
                  onClick={() => navigate('/estadisticas')}
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
                    onClick={() => navigate('/registrar')}
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
                  onClick={() => navigate('/consultar')}
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
                  onClick={() => navigate('/productores')}
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
                  onClick={() => navigate('/directorio')}
                  title="Geodirectorio Rural"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-smooth border-l-4 ${
                    currentPath === '/directorio'
                      ? 'bg-gradient-to-r from-[#C29A52]/35 to-transparent text-white border-l-nayarit-gold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border-l-transparent'
                  }`}
                >
                  <Compass className={`w-5 h-5 ${currentPath === '/directorio' ? 'text-nayarit-gold' : 'text-slate-300'}`} />
                </button>
                {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => navigate('/usuarios')}
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
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/20 hover:text-red-200 transition-smooth border border-red-500/10"
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
                onClick={onLogout}
                title="Cerrar Sesión"
                className="w-12 h-12 flex items-center justify-center rounded-xl text-red-300 hover:bg-red-950/20 hover:text-red-200 transition-smooth border border-red-500/10"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* NAV SUPERIOR MÓVIL */}
        <header className="md:hidden bg-gradient-to-r from-[#5E1232] to-[#3a051a] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5 max-w-[70%]">
            <div className="bg-white p-1 rounded-lg shrink-0">
              <img src="/logo-sdr.png" alt="SDR Nayarit" className="h-6 w-auto object-contain" />
            </div>
            <h2 className="font-extrabold text-xs tracking-wider uppercase truncate">
              {captureState.title}
            </h2>
          </div>
          {captureState.actions && captureState.actions.length > 0 ? (
            <div className="flex items-center gap-2">
              {captureState.actions.filter(a => a.id === 'cancelar' || a.id === 'navigate-registrar').map(act => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    if (act.id === 'navigate-registrar') navigate('/registrar');
                    else if (act.id === 'navigate-consultar') navigate('/consultar');
                    else window.dispatchEvent(new CustomEvent(`sdr-navbar-action-${act.id}`));
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                    act.id === 'cancelar' ? 'bg-red-500/20 border border-red-500/30 text-red-200' : 'bg-white/10 text-white'
                  }`}
                >
                  {act.text.split(' ')[0]}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-white/10 rounded-xl"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 text-red-300" />
            </button>
          )}
        </header>

        {/* NAV BAR SUPERIOR (DESKTOP) */}
        <header className="hidden md:flex items-center justify-between px-8 py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shrink-0 shadow-sm text-slate-800 transition-all duration-300 relative z-30">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-sdr.png" 
              alt="Secretaría de Desarrollo Rural Nayarit" 
              className="h-10 w-auto object-contain shrink-0" 
            />
            <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-nayarit-gold/10 rounded-xl text-nayarit-gold border border-nayarit-gold/25 flex items-center justify-center shrink-0 shadow-2xs">
                {IconComponent && <IconComponent className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-nayarit-gold uppercase tracking-widest leading-none block">
                  {captureState.label}
                </span>
                <h2 className="text-[15px] font-black text-nayarit-dark uppercase tracking-wide mt-0.5">
                  {captureState.title}
                </h2>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* BUSCADOR INTERACTIVO EN NAVBAR */}
            <BuscadorNavbar onSelectExpediente={handleOpenDetail} />

            {/* CENTRO DE NOTIFICACIONES */}
            <CentroNotificacionesMenu onSelectExpediente={handleOpenDetail} />

            {captureState.actions && captureState.actions.map(act => {
              if (act.id === 'navigate-registrar') {
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => navigate('/registrar')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-nayarit-green text-white hover:bg-nayarit-lightGreen rounded-xl text-[11px] font-bold transition-smooth shadow-2xs cursor-pointer uppercase tracking-wider font-extrabold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {act.text}
                  </button>
                );
              }
              if (act.id === 'navigate-consultar') {
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => navigate('/consultar')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-smooth shadow-2xs cursor-pointer uppercase tracking-wider font-extrabold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-nayarit-gold" />
                    {act.text}
                  </button>
                );
              }
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

        {/* NAVEGACIÓN MÓVIL TAB BAR */}
        <nav className="md:hidden bg-white border-t border-slate-200 flex justify-around py-2 shrink-0 z-20 shadow-lg">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentPath === '/' ? 'text-nayarit-gold' : 'text-slate-400'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          {currentUser?.role !== 'ANALISTA' && (
            <button
              onClick={() => navigate('/registrar')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentPath === '/registrar' ? 'text-nayarit-gold' : 'text-slate-400'}`}
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Solicitud
            </button>
          )}
          <button
            onClick={() => navigate('/consultar')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentPath === '/consultar' ? 'text-nayarit-gold' : 'text-slate-400'}`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            Expedientes
          </button>
          <button
            onClick={() => navigate('/productores')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentPath === '/productores' ? 'text-nayarit-gold' : 'text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
            Productores
          </button>
        </nav>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full pb-24 md:pb-6">
          {children}
        </main>
      </div>

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
