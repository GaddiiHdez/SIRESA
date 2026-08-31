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
        title: "MESA DE CONTROL",
        iconKey: "SOLICITUDES",
        actions: [
          { id: "actualizar", text: "Actualizar" }
        ]
      }
    }));

    const onActualizar = () => {
      setRefreshing(true);
      loadData();
    };

    const onGlobalUpdate = () => {
      loadData();
    };

    window.addEventListener('sdr-navbar-action-actualizar', onActualizar);
    window.addEventListener('sdr-solicitud-updated', onGlobalUpdate);

    return () => {
      window.removeEventListener('sdr-navbar-action-actualizar', onActualizar);
      window.removeEventListener('sdr-solicitud-updated', onGlobalUpdate);
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

  // Lista filtrada según pestaña
  const filteredList = useMemo(() => {
    if (activeTab === 'PENDIENTES') return pendientes;
    if (activeTab === 'APROBADAS') return aprobadas;
    return solicitudes;
  }, [solicitudes, pendientes, aprobadas, activeTab]);

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
      
      {/* ── 1. ENCABEZADO INSTITUCIONAL DE CONTROL OPERATIVO ──────────────────────── */}
      <div className="bg-[#5E1232] text-white rounded-xl p-5 md:p-6 shadow-sm border border-[#5E1232] relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="text-[11px] font-bold text-[#DAB777] uppercase tracking-wider">
              {getFechaFormateada()}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Mesa de Control y Dictaminación
            </h1>
            <p className="text-xs md:text-sm text-slate-200 font-medium">
              Hay <strong className="text-amber-300 font-bold">{pendientes.length} expediente(s) pendientes de atención</strong> en el flujo de revisión y dictamen de la Secretaría.
            </p>
          </div>

          {currentUser?.role !== 'ANALISTA' && (
            <div className="w-full sm:w-auto shrink-0">
              <button
                onClick={() => navigate('/registrar')}
                className="w-full sm:w-auto py-2.5 px-5 bg-[#C29A52] hover:bg-[#b08b47] text-[#200210] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>Nueva Solicitud</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. TARJETAS DE ESTADO OPERATIVO (FILTROS RÁPIDOS) ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* PENDIENTES / POR DICTAMINAR */}
        <button
          onClick={() => setActiveTab('PENDIENTES')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeTab === 'PENDIENTES'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Por Dictaminar</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{pendientes.length}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Pendientes de revisión</span>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg">
            <Inbox size={20} />
          </div>
        </button>

        {/* DICTAMINADAS Y APROBADAS */}
        <button
          onClick={() => setActiveTab('APROBADAS')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeTab === 'APROBADAS'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Listas para Pago</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{aprobadas.length}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Dictaminadas y aprobadas</span>
          </div>
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </button>

        {/* TOTAL DE EXPEDIENTES */}
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeTab === 'TODAS'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">Total en Trámite</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{solicitudes.length}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Expedientes activos</span>
          </div>
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg">
            <FileText size={20} />
          </div>
        </button>

        {/* PADRÓN DE PRODUCTORES */}
        <button
          onClick={() => navigate('/productores')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block whitespace-nowrap">Padrón de Productores</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{stats?.resumen?.beneficiarios?.total || 0}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Productores registrados</span>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <User size={20} />
          </div>
        </button>


      </div>

      {/* ── 3. BANDEJA DE TAREAS Y EXPEDIENTES (TABLA OPERATIVA) ──────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* HEADER DE LA BANDEJA CON PESTAÑAS */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-[#5E1232] rounded-lg">
              <Inbox size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Expedientes y Solicitudes
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {filteredList.length} expediente(s) en esta vista
              </span>
            </div>
          </div>

          {/* PESTAÑAS OPERATIVAS */}
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('PENDIENTES')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'PENDIENTES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Dictaminar ({pendientes.length})
            </button>
            <button
              onClick={() => setActiveTab('APROBADAS')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'APROBADAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aprobadas ({aprobadas.length})
            </button>
            <button
              onClick={() => setActiveTab('TODAS')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'TODAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({solicitudes.length})
            </button>
          </div>

        </div>

        {/* LISTADO / TABLA DE EXPEDIENTES */}
        {filteredList.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-slate-50">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Bandeja sin pendientes</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay expedientes pendientes con los filtros seleccionados.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">Folio / Sector</th>
                  <th className="py-3 px-5">Productor Titular</th>
                  <th className="py-3 px-5">Ubicación</th>
                  <th className="py-3 px-5">Monto Solicitado</th>
                  <th className="py-3 px-5 text-center">Estatus</th>
                  <th className="py-3 px-5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {filteredList.map((sol) => {
                  const SectorIcon = getSectorIcon(sol.moduloTipo);
                  const prodNombre = sol.productor?.nombreCompleto || 
                    `${sol.productor?.nombre || ''} ${sol.productor?.apellidoPaterno || ''}`.trim() ||
                    sol.productor?.nombreOrganizacion || 'Productor Registrado';

                  return (
                    <tr key={sol.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* FOLIO Y SECTOR */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-100 text-[#5E1232] rounded-lg shrink-0">
                            <SectorIcon size={15} />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              {sol.folio}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              {formatModulo(sol.moduloTipo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PRODUCTOR */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 text-xs">{prodNombre}</div>
                        {sol.productor?.curp && (
                          <span className="font-mono text-[10px] text-slate-500 block">
                            {sol.productor.curp}
                          </span>
                        )}
                      </td>

                      {/* UBICACIÓN */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-800">{sol.productor?.municipio || 'Nayarit'}</div>
                        <div className="text-slate-500 text-[10px]">{sol.productor?.localidad || 'Localidad'}</div>
                      </td>

                      {/* APOYO SOLICITADO */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          {formatMoneda(sol.apoyoControl?.montoTotal || 0)}
                        </div>
                        <div className="text-slate-500 text-[10px] truncate max-w-xs font-medium">
                          {sol.apoyoControl?.conceptoApoyo || 'Apoyo al sector'}
                        </div>
                      </td>

                      {/* ESTATUS */}
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(sol.status)}`}>
                          {sol.status}
                        </span>
                      </td>

                      {/* ACCIÓN: REVISAR */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleOpenExpediente(sol.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Revisar</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER CON BOTÓN DE CONSULTA */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Expedientes registrados en el ciclo fiscal activo.
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/consultar')}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Consulta Avanzada →
            </button>
            {currentUser?.role !== 'ANALISTA' && (
              <button
                onClick={() => navigate('/registrar')}
                className="px-3.5 py-1.5 bg-[#5E1232] hover:bg-[#4a0d27] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
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
