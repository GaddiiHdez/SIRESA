import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStats, apiGetSolicitudes, apiGetSolicitud, apiActualizarEstatus, getCurrentUser } from '../../../shared/services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, 
  CheckCircle2, 
  Clock, 
  Search, 
  PlusCircle, 
  FileText, 
  ChevronRight, 
  User, 
  MapPin, 
  DollarSign, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Send
} from 'lucide-react';
import ExpedienteDetalleModal from '../../solicitudes/components/ExpedienteDetalleModal';
import { formatMoneda, formatModulo } from '../../../shared/utils/formatters';
import { getSectorIcon } from '../../../shared/config/sectoresMetadata';
import { toast } from '../../../shared/utils/toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stats, setStats] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pestaña activa en la Bandeja de Tareas ('PENDIENTES', 'APROBADAS', 'TODAS')
  const [activeTab, setActiveTab] = useState('PENDIENTES');

  // Buscador rápido omnibox en el hero
  const [quickSearch, setQuickSearch] = useState('');

  // Modal de Detalle de Expediente In-Place
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newEstatus, setNewEstatus] = useState('');
  const [estatusComentario, setEstatusComentario] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, solsData] = await Promise.all([
        apiGetStats(),
        apiGetSolicitudes({ limit: 60 })
      ]);
      setStats(statsData);
      setSolicitudes(solsData.solicitudes || []);
    } catch (error) {
      console.error("Error al cargar datos del panel de control:", error);
      toast.error("Error al sincronizar datos de la mesa de control.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Actualizar Navbar Superior
    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        label: "CENTRO DE OPERACIONES",
        title: "MESA DE CONTROL Y BANDEJA DE TRABAJO",
        iconKey: "SOLICITUDES",
        actions: [
          { id: "actualizar", text: "Actualizar" },
          ...(currentUser?.role !== 'ANALISTA' ? [{ id: "navigate-registrar", text: "Nueva Solicitud" }] : [])
        ]
      }
    }));

    const onActualizar = () => {
      setRefreshing(true);
      loadData();
    };

    window.addEventListener('sdr-navbar-action-actualizar', onActualizar);
    return () => {
      window.removeEventListener('sdr-navbar-action-actualizar', onActualizar);
    };
  }, []);

  // Saludo dinámico según la hora del día
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return '¡Buenos días';
    if (hora < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // Fecha formateada en español
  const getFechaFormateada = () => {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Abrir modal de expediente in-place
  const handleOpenExpediente = async (solId) => {
    setModalLoading(true);
    try {
      const detail = await apiGetSolicitud(solId);
      setSelectedSolicitud(detail);
      setNewEstatus(detail.status);
      setEstatusComentario('');
    } catch (error) {
      console.error("Error al abrir expediente:", error);
      toast.error("Error al cargar expediente.");
    } finally {
      setModalLoading(false);
    }
  };

  // Actualizar estatus desde el modal in-place
  const handleUpdateEstatus = async (e) => {
    e.preventDefault();
    if (!newEstatus) return;

    setUpdateLoading(true);
    try {
      const updated = await apiActualizarEstatus(selectedSolicitud.id, newEstatus, estatusComentario);
      await handleOpenExpediente(updated.id);
      loadData();
      toast.success("Estatus actualizado exitosamente.");
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      toast.error(error.message || "Error al actualizar estatus.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Clasificación de expedientes por bandeja
  const pendientes = useMemo(() => {
    return solicitudes.filter(s => s.status === 'REGISTRADA' || s.status === 'EN REVISIÓN');
  }, [solicitudes]);

  const aprobadas = useMemo(() => {
    return solicitudes.filter(s => s.status === 'DICTAMINADA' || s.status === 'APROBADA' || s.status === 'PAGADA' || s.status === 'FINALIZADA');
  }, [solicitudes]);

  // Lista filtrada según pestaña y buscador rápido
  const filteredList = useMemo(() => {
    let list = solicitudes;
    if (activeTab === 'PENDIENTES') list = pendientes;
    if (activeTab === 'APROBADAS') list = aprobadas;

    if (!quickSearch.trim()) return list;

    const q = quickSearch.toLowerCase().trim();
    return list.filter(s => {
      const folioMatch = s.folio?.toLowerCase().includes(q);
      const prodMatch = (s.productor?.nombreCompleto || `${s.productor?.nombre || ''} ${s.productor?.apellidoPaterno || ''}`)?.toLowerCase().includes(q);
      const curpMatch = s.productor?.curp?.toLowerCase().includes(q);
      const munMatch = s.productor?.municipio?.toLowerCase().includes(q);
      return folioMatch || prodMatch || curpMatch || munMatch;
    });
  }, [solicitudes, pendientes, aprobadas, activeTab, quickSearch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REGISTRADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EN REVISIÓN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DICTAMINADA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'APROBADA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PAGADA':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando Mesa de Control...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ── 1. HERO OPERATIVO Y BIENVENIDA ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-nayarit-burgundy via-[#4A0D26] to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Decoración geométrica institucional */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Saludo y Resumen */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles size={14} />
              <span>{getFechaFormateada()}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {getSaludo()}, {currentUser?.name?.split(' ')[0] || 'Administrador'} 👋
            </h1>

            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              Actualmente tienes <strong className="text-amber-300 font-bold">{pendientes.length} expediente(s) pendientes de atención</strong> en el flujo de validación y dictamen de la Secretaría.
            </p>
          </div>

          {/* Buscador Rápido de Expediente */}
          <div className="w-full lg:w-96">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Buscar folio, CURP o productor..."
                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-semibold text-white placeholder-slate-400 outline-none focus:bg-white focus:text-slate-900 focus:border-white transition-all shadow-inner"
              />
              {quickSearch && (
                <button
                  onClick={() => setQuickSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-white/10 px-2 py-0.5 rounded-lg"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. TARJETAS DE ESTADO OPERATIVO (FILTROS RÁPIDOS) ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PENDIENTES / POR DICTAMINAR */}
        <button
          onClick={() => setActiveTab('PENDIENTES')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeTab === 'PENDIENTES'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 block">Por Dictaminar</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{pendientes.length}</span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Nuevas y en revisión</span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Inbox size={22} />
          </div>
        </button>

        {/* DICTAMINADAS Y APROBADAS */}
        <button
          onClick={() => setActiveTab('APROBADAS')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeTab === 'APROBADAS'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">Listas para Pago</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{aprobadas.length}</span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Dictaminadas y aprobadas</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </button>

        {/* TOTAL DE EXPEDIENTES */}
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeTab === 'TODAS'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">Total en Trámite</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{solicitudes.length}</span>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Expedientes registrados</span>
          </div>
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <FileText size={22} />
          </div>
        </button>

        {/* PADRÓN DE PRODUCTORES */}
        <button
          onClick={() => navigate('/productores')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 block">Padrón de Productores</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.resumen?.beneficiarios?.total || 0}</span>
            <span className="text-[10px] text-purple-600 font-bold mt-0.5 flex items-center gap-1 group-hover:underline">
              Ir al padrón <ArrowUpRight size={12} />
            </span>
          </div>
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
            <User size={22} />
          </div>
        </button>

      </div>

      {/* ── 3. BANDEJA DE TAREAS Y EXPEDIENTES (TABLA OPERATIVA) ──────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* HEADER DE LA BANDEJA CON PESTAÑAS */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-nayarit-burgundy/10 text-nayarit-burgundy rounded-xl">
              <Inbox size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-none">
                Bandeja de Tareas y Expedientes
              </h2>
              <span className="text-xs text-slate-400 font-semibold mt-1 block">
                {filteredList.length} expediente(s) mostrados en esta vista
              </span>
            </div>
          </div>

          {/* PESTAÑAS OPERATIVAS */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('PENDIENTES')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                activeTab === 'PENDIENTES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Por Atender ({pendientes.length})
            </button>
            <button
              onClick={() => setActiveTab('APROBADAS')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                activeTab === 'APROBADAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Listas para Pago ({aprobadas.length})
            </button>
            <button
              onClick={() => setActiveTab('TODAS')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                activeTab === 'TODAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({solicitudes.length})
            </button>
          </div>

        </div>

        {/* LISTADO / TABLA DE EXPEDIENTES */}
        {filteredList.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-slate-50/50">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">¡Bandeja al día!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay expedientes pendientes en este momento con los filtros seleccionados.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Folio y Sector</th>
                  <th className="py-3.5 px-6">Productor / Titular</th>
                  <th className="py-3.5 px-6">Ubicación</th>
                  <th className="py-3.5 px-6">Apoyo Solicitado</th>
                  <th className="py-3.5 px-6 text-center">Estatus</th>
                  <th className="py-3.5 px-6 text-center">Acción Inmediata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredList.map((sol) => {
                  const SectorIcon = getSectorIcon(sol.moduloTipo);
                  const prodNombre = sol.productor?.nombreCompleto || 
                    `${sol.productor?.nombre || ''} ${sol.productor?.apellidoPaterno || ''}`.trim() ||
                    sol.productor?.nombreOrganizacion || 'Productor Registrado';

                  return (
                    <tr key={sol.id} className="hover:bg-slate-50/70 transition-all">
                      
                      {/* FOLIO Y SECTOR */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-100 text-nayarit-gold rounded-xl shrink-0">
                            <SectorIcon size={16} />
                          </div>
                          <div>
                            <span className="font-mono font-extrabold text-slate-900 text-xs block">
                              {sol.folio}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              {formatModulo(sol.moduloTipo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PRODUCTOR */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-xs">{prodNombre}</div>
                        {sol.productor?.curp && (
                          <span className="font-mono text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {sol.productor.curp}
                          </span>
                        )}
                      </td>

                      {/* UBICACIÓN */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{sol.productor?.municipio || 'Nayarit'}</div>
                        <div className="text-slate-400 text-[10px]">{sol.productor?.localidad || 'Localidad'}</div>
                      </td>

                      {/* APOYO SOLICITADO */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {formatMoneda(sol.apoyoControl?.montoTotal || 0)}
                        </div>
                        <div className="text-slate-500 text-[10px] truncate max-w-xs font-medium">
                          {sol.apoyoControl?.conceptoApoyo || 'Apoyo al sector'}
                        </div>
                      </td>

                      {/* ESTATUS */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(sol.status)}`}>
                          {sol.status}
                        </span>
                      </td>

                      {/* ACCIÓN INMEDIATA: REVISAR TRÁMITE */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenExpediente(sol.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
                        >
                          <span>Revisar Trámite</span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER CON BOTÓN DE NUEVA SOLICITUD */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-semibold">
            Mostrando los expedientes más recientes del ciclo fiscal activo.
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/consultar')}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Ver Consulta Avanzada →
            </button>
            {currentUser?.role !== 'ANALISTA' && (
              <button
                onClick={() => navigate('/registrar')}
                className="px-4 py-2 bg-nayarit-burgundy hover:bg-[#4A0D26] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <PlusCircle size={14} /> Nueva Solicitud
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── 4. MODAL DE DETALLE Y DICTAMEN DE EXPEDIENTE IN-PLACE ──────────────── */}
      {selectedSolicitud && (
        <ExpedienteDetalleModal
          solicitud={selectedSolicitud}
          loading={modalLoading}
          onClose={() => setSelectedSolicitud(null)}
          currentUser={currentUser}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          onUpdateEstatus={handleUpdateEstatus}
        />
      )}

    </div>
  );
}
