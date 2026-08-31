import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, History, Search, Filter, RefreshCw, Download, 
  Calendar, User, Globe, FileText, ChevronLeft, ChevronRight, 
  Eye, CheckCircle2, AlertTriangle, ArrowRight, Lock, Activity
} from 'lucide-react';
import { apiGetAuditLogs, apiGetAuditStats, getCurrentUser } from '../../../shared/services/api';
import { toast } from '../../../shared/utils/toast';

export default function BitacoraAuditoriaPage() {
  const currentUser = getCurrentUser();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtros
  const [search, setSearch] = useState('');
  const [modulo, setModulo] = useState('TODOS');
  const [accion, setAccion] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Modal de Detalle / Diff Viewer
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20
      };
      if (search.trim()) params.search = search.trim();
      if (modulo !== 'TODOS') params.modulo = modulo;
      if (accion !== 'TODOS') params.accion = accion;
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const data = await apiGetAuditLogs(params);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      toast.error(err.message || 'Error al cargar la bitácora de auditoría.');
    } finally {
      setLoading(false);
    }
  }, [page, search, modulo, accion, fechaInicio, fechaFin]);

  const fetchStats = async () => {
    try {
      const data = await apiGetAuditStats();
      setStats(data);
    } catch (err) {
      console.error('Error al obtener estadísticas de auditoría', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setModulo('TODOS');
    setAccion('TODOS');
    setFechaInicio('');
    setFechaFin('');
    setPage(1);
  };

  // Exportar Bitácora a CSV con BOM UTF-8
  const handleExportCsv = () => {
    if (!logs || logs.length === 0) {
      toast.error('No hay registros para exportar.');
      return;
    }

    const headers = ['ID', 'Fecha y Hora', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Descripción / Detalles', 'Dirección IP'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('es-MX'),
      l.username || 'SISTEMA',
      l.userRole || 'N/A',
      l.modulo,
      l.accion,
      `"${(l.detalles || '').replace(/"/g, '""')}"`,
      l.ipAddress || 'Desconocida'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bitacora_Auditoria_SIRESA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Bitácora de auditoría exportada exitosamente.');
  };

  // Formateadores visuales
  const getAccionBadge = (acc) => {
    switch (acc) {
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">LOGIN</span>;
      case 'CREAR_SOLICITUD':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CREAR SOLICITUD</span>;
      case 'CAMBIO_ESTATUS':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">CAMBIO ESTATUS</span>;
      case 'CARGA_DOCUMENTO':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">DOCUMENTOS</span>;
      case 'AJUSTE_PRESUPUESTO':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">PRESUPUESTO</span>;
      case 'CREAR_USUARIO':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">ALTA USUARIO</span>;
      case 'EDITAR_USUARIO':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">EDICIÓN USUARIO</span>;
      case 'ELIMINAR_USUARIO':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">BAJA USUARIO</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{acc}</span>;
    }
  };

  const getModuloBadge = (mod) => {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-white">
        {mod}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── CABECERA INSTITUCIONAL SUPERADMIN ───────────────────────────────────── */}
      <div className="bg-[#5E1232] text-white rounded-xl p-5 md:p-6 shadow-sm border border-[#5E1232] relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#DAB777] uppercase tracking-wider block">
              Registro Oficial de Seguridad y Trazabilidad
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-[#DAB777] shrink-0" />
              Bitácora de Auditoría
            </h1>
            <p className="text-xs md:text-sm text-slate-200 max-w-2xl font-medium">
              Historial de movimientos, cambios de estatus en solicitudes, ajustes presupuestales y accesos al sistema.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => { fetchLogs(); fetchStats(); }}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/15 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#C29A52] hover:bg-[#b08842] text-[#200210] rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Download size={14} />
              <span>Exportar Bitácora</span>
            </button>
          </div>
        </div>

        {/* METRICAS DE AUDITORIA */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/15">
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Total de Eventos</span>
              <span className="text-xl md:text-2xl font-bold text-white mt-0.5 block">{stats.totalRegistros}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Actividad Hoy</span>
              <span className="text-xl md:text-2xl font-bold text-amber-300 mt-0.5 block">+{stats.eventosHoy}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Módulos Auditados</span>
              <span className="text-xl md:text-2xl font-bold text-white mt-0.5 block">{stats.porModulo?.length || 5}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Usuario Más Activo</span>
              <span className="text-lg font-bold text-emerald-300 mt-0.5 block truncate">
                @{stats.topUsuarios?.[0]?.username || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>


      {/* ── BARRA DE BÚSQUEDA Y FILTROS ────────────────────────────────────────── */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Buscador General */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por usuario, folio, IP, descripción..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-nayarit-gold/50 focus:border-nayarit-gold transition-all"
            />
          </div>

          {/* Filtro Módulo */}
          <div>
            <select
              value={modulo}
              onChange={e => setModulo(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-nayarit-burgundy transition-all"
            >
              <option value="TODOS">Todos los Módulos</option>
              <option value="AUTH">AUTH (Sesiones)</option>
              <option value="SOLICITUDES">SOLICITUDES (Expedientes)</option>
              <option value="DOCUMENTOS">DOCUMENTOS (Archivos)</option>
              <option value="PRESUPUESTOS">PRESUPUESTOS (Techos)</option>
              <option value="USUARIOS">USUARIOS (Cuentas)</option>
            </select>
          </div>

          {/* Filtro Acción */}
          <div>
            <select
              value={accion}
              onChange={e => setAccion(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-nayarit-burgundy transition-all"
            >
              <option value="TODOS">Todas las Acciones</option>
              <option value="LOGIN">LOGIN (Inicio de sesión)</option>
              <option value="CREAR_SOLICITUD">CREAR_SOLICITUD</option>
              <option value="CAMBIO_ESTATUS">CAMBIO_ESTATUS</option>
              <option value="CARGA_DOCUMENTO">CARGA_DOCUMENTO</option>
              <option value="AJUSTE_PRESUPUESTO">AJUSTE_PRESUPUESTO</option>
              <option value="CREAR_USUARIO">CREAR_USUARIO</option>
              <option value="EDITAR_USUARIO">EDITAR_USUARIO</option>
              <option value="ELIMINAR_USUARIO">ELIMINAR_USUARIO</option>
            </select>
          </div>
        </div>

        {/* Filtro Fechas y Botones */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Rango de Fecha:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
            />
            <span>hasta</span>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
            >
              Limpiar Filtros
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-smooth shadow-sm cursor-pointer"
            >
              Filtrar Bitácora
            </button>
          </div>
        </div>
      </form>

      {/* ── TABLA DE EVENTOS DE AUDITORÍA ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-nayarit-burgundy" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Línea de Tiempo de Operaciones ({totalItems} eventos)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Página {page} de {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-nayarit-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Cargando registros de auditoría...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron registros</h4>
            <p className="text-xs text-slate-500">Prueba ajustando los filtros de búsqueda o el rango de fechas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalle / Descripción</th>
                  <th className="px-4 py-3">IP / Origen</th>
                  <th className="px-4 py-3 text-right">Evidencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const hasSnapshots = Boolean(log.valoresAnt || log.valoresNue);
                  return (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString('es-MX', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">
                            {log.username?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">@{log.username || 'SISTEMA'}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">{log.userRole || 'SISTEMA'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getModuloBadge(log.modulo)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getAccionBadge(log.accion)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium max-w-xs truncate" title={log.detalles}>
                        {log.detalles || 'Sin descripción adicional'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {hasSnapshots ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-smooth cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Ver Diff</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sin datos</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINADOR */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Mostrando {logs.length} de {totalItems} eventos registrados
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL INSPECTOR DE DIFF / EVIDENCIA FORENSE ───────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-slate-900 to-[#5E1232] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-nayarit-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Inspección de Evidencia Forense</h3>
                  <p className="text-[11px] text-slate-300">ID de Transacción: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Metadatos */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Usuario</span>
                  <span className="font-bold text-slate-800">@{selectedLog.username} ({selectedLog.userRole})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Módulo / Acción</span>
                  <span className="font-bold text-slate-800">{selectedLog.modulo} - {selectedLog.accion}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Dirección IP</span>
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha y Hora</span>
                  <span className="text-slate-700">{new Date(selectedLog.createdAt).toLocaleString('es-MX')}</span>
                </div>
              </div>

              {selectedLog.detalles && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                  <strong>Descripción:</strong> {selectedLog.detalles}
                </div>
              )}

              {/* Visor de Cambios (Antes vs Después) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Comparativa de Datos Modificados (Snapshot JSON):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estado Anterior */}
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-2">
                      🔴 Estado Previo (Antes)
                    </span>
                    <pre className="text-[11px] font-mono text-rose-950 bg-white/75 p-3 rounded-xl border border-rose-100 overflow-x-auto max-h-60">
                      {selectedLog.valoresAnt ? JSON.stringify(selectedLog.valoresAnt, null, 2) : 'No existía registro previo (Creación inicial)'}
                    </pre>
                  </div>

                  {/* Estado Nuevo */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                      🟢 Estado Actual (Después)
                    </span>
                    <pre className="text-[11px] font-mono text-emerald-950 bg-white/75 p-3 rounded-xl border border-emerald-100 overflow-x-auto max-h-60">
                      {selectedLog.valoresNue ? JSON.stringify(selectedLog.valoresNue, null, 2) : 'Sin datos posteriores (Eliminación)'}
                    </pre>
                  </div>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                  <strong>User-Agent:</strong> {selectedLog.userAgent}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
