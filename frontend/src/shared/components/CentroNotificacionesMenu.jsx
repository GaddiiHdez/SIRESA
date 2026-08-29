import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, FileText, AlertCircle, CheckCircle2, Clock, ChevronRight, X, 
  Sprout, Beef, Fish, Construction, Wrench, FileSpreadsheet, RotateCw, 
  ArrowUpRight, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { apiGetSolicitudes } from '../services/api';
import { formatMoneda, formatFecha, formatModulo } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const SECTOR_CONFIG = {
  'AGRICULTURA_FRIJOL': { label: 'Agricultura', icon: Sprout, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'GANADERIA': { label: 'Ganadería', icon: Beef, color: 'text-amber-800 bg-amber-50 border-amber-200' },
  'PESCA_ACUACULTURA': { label: 'Pesca', icon: Fish, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  'INFRAESTRUCTURA': { label: 'Infraestructura', icon: Construction, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  'MAQUINARIA': { label: 'Maquinaria', icon: Wrench, color: 'text-slate-700 bg-slate-100 border-slate-200' },
  'MEDIOS': { label: 'Medios', icon: FileSpreadsheet, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  'TEMAS_IMPORTANTES': { label: 'Temas', icon: FileSpreadsheet, color: 'text-purple-700 bg-purple-50 border-purple-200' }
};

export default function CentroNotificacionesMenu({ onSelectExpediente }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [rawSolicitudes, setRawSolicitudes] = useState([]);
  const [activeTab, setActiveTab] = useState('TODAS'); // 'TODAS' | 'DICTAMEN' | 'DOCS'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotificaciones();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleGlobalUpdate = () => {
      fetchNotificaciones();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('sdr-solicitud-updated', handleGlobalUpdate);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('sdr-solicitud-updated', handleGlobalUpdate);
    };
  }, []);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const res = await apiGetSolicitudes({ limit: 30 });
      const list = Array.isArray(res) ? res : (res?.solicitudes || []);
      setRawSolicitudes(list);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper para nombre real del productor
  const getProductorNombre = (prod) => {
    if (!prod) return 'Trámite General / Sin Productor';
    if (prod.tipoPersona === 'FISICA') {
      const full = `${prod.nombre || ''} ${prod.apellidoPaterno || ''} ${prod.apellidoMaterno || ''}`.trim();
      return full || 'Productor Persona Física';
    }
    return prod.nombreOrganizacion || prod.representante || 'Organización Colectiva';
  };

  // Helper para calcular documentos faltantes
  const getDocumentosFaltantes = (sol) => {
    if (sol.moduloTipo === 'MEDIOS' || sol.moduloTipo === 'TEMAS_IMPORTANTES') return 0;
    let count = 0;
    if (!sol.ineUrl) count++;
    if (!sol.curpUrl) count++;
    if (!sol.rfcUrl) count++;
    if (!sol.comprobanteUrl) count++;
    if (!sol.facturaUrl) count++;
    return count;
  };

  // Filtrado por pestañas
  const tramitesDictamen = rawSolicitudes.filter(s => ['REGISTRADA', 'EN REVISIÓN'].includes(s.status));
  const tramitesDocsFaltantes = rawSolicitudes.filter(s => getDocumentosFaltantes(s) > 0);

  let filteredList = [];
  if (activeTab === 'DICTAMEN') {
    filteredList = tramitesDictamen;
  } else if (activeTab === 'DOCS') {
    filteredList = tramitesDocsFaltantes;
  } else {
    // TODAS: las que requieran atención (dictamen o docs faltantes)
    filteredList = rawSolicitudes.filter(s => ['REGISTRADA', 'EN REVISIÓN'].includes(s.status) || getDocumentosFaltantes(s) > 0);
  }

  const totalAtencion = tramitesDictamen.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BOTÓN CAMPANA NOTIFICACIONES */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotificaciones();
        }}
        className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-smooth cursor-pointer border border-slate-200/70"
        title="Centro de Alertas y Notificaciones"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {totalAtencion > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#5E1232] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
            {totalAtencion > 99 ? '99+' : totalAtencion}
          </span>
        )}
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 md:w-[420px] bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/10 border border-slate-200 z-[999] overflow-hidden animate-scaleUp">
          
          {/* Cabecera Guinda Institucional */}
          <div className="p-4 bg-gradient-to-r from-[#5E1232] via-[#480c25] to-[#250311] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-nayarit-gold/20 rounded-xl text-amber-300 border border-nayarit-gold/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider block leading-tight">
                  Centro de Notificaciones
                </span>
                <h3 className="font-black text-sm tracking-wide text-white leading-tight">
                  Alertas y Trámites Activos
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchNotificaciones}
                disabled={loading}
                className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-smooth cursor-pointer"
                title="Actualizar alertas"
              >
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-smooth cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pestañas de Filtro (Tabs) */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 pt-2.5 flex items-center gap-1 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('TODAS')}
              className={`px-3 py-1.5 rounded-t-xl transition-smooth flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TODAS'
                  ? 'bg-white text-[#5E1232] border-t-2 border-l border-r border-[#5E1232] shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Todas</span>
              <span className="px-1.5 py-0.25 bg-slate-200 text-slate-700 text-[9px] rounded-full">
                {rawSolicitudes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DICTAMEN')}
              className={`px-3 py-1.5 rounded-t-xl transition-smooth flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'DICTAMEN'
                  ? 'bg-white text-[#5E1232] border-t-2 border-l border-r border-[#5E1232] shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Por Dictaminar</span>
              {tramitesDictamen.length > 0 && (
                <span className="px-1.5 py-0.25 bg-amber-100 text-amber-800 text-[9px] rounded-full font-black">
                  {tramitesDictamen.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('DOCS')}
              className={`px-3 py-1.5 rounded-t-xl transition-smooth flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'DOCS'
                  ? 'bg-white text-[#5E1232] border-t-2 border-l border-r border-[#5E1232] shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Docs Faltantes</span>
              {tramitesDocsFaltantes.length > 0 && (
                <span className="px-1.5 py-0.25 bg-rose-100 text-rose-800 text-[9px] rounded-full font-black">
                  {tramitesDocsFaltantes.length}
                </span>
              )}
            </button>
          </div>

          {/* Listado de Alertas */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2.5">
                <div className="w-6 h-6 border-2 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
                <span>Actualizando alertas de trámites...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">¡Bandeja al día!</p>
                <p className="text-[11px] text-slate-400">
                  No hay trámites pendientes bajo esta categoría en este momento.
                </p>
              </div>
            ) : (
              filteredList.slice(0, 10).map((sol) => {
                const prodName = getProductorNombre(sol.productor);
                const faltantes = getDocumentosFaltantes(sol);
                const sectorCfg = SECTOR_CONFIG[sol.moduloTipo] || { 
                  label: formatModulo(sol.moduloTipo), 
                  icon: FileSpreadsheet, 
                  color: 'text-slate-700 bg-slate-100 border-slate-200' 
                };
                const SectorIcon = sectorCfg.icon;

                const isDictamenPending = ['REGISTRADA', 'EN REVISIÓN'].includes(sol.status);

                return (
                  <div
                    key={sol.id}
                    onClick={() => {
                      onSelectExpediente(sol.id);
                      setIsOpen(false);
                    }}
                    className="p-3 hover:bg-slate-50/90 rounded-2xl transition-all cursor-pointer flex items-start gap-3 group border border-transparent hover:border-slate-200/80 mb-1"
                  >
                    {/* Icono de Sector */}
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${sectorCfg.color}`}>
                      <SectorIcon className="w-4 h-4" />
                    </div>

                    {/* Datos del Expediente */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-black text-xs text-slate-900 group-hover:text-[#5E1232] transition-colors">
                          {sol.folio}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          sol.status === 'REGISTRADA' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : sol.status === 'EN REVISIÓN'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : sol.status === 'DICTAMINADA'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : sol.status === 'APROBADA' || sol.status === 'PAGADA'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {sol.status}
                        </span>
                      </div>

                      {/* Nombre Productor */}
                      <p className="text-xs text-slate-700 font-bold truncate mt-0.5" title={prodName}>
                        {prodName}
                      </p>

                      {/* Badges de soporte (Ubicación, Monto, Faltantes) */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1.5 pt-1 border-t border-slate-100/80">
                        <span className="text-slate-500 truncate max-w-[140px]">
                          {sol.productor?.municipio || 'Nayarit'} • {formatFecha(sol.fechaRegistro)}
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {faltantes > 0 && (
                            <span className="px-1.5 py-0.25 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[9px] flex items-center gap-0.5" title={`${faltantes} documento(s) faltante(s)`}>
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              {faltantes} doc(s)
                            </span>
                          )}
                          <span className="font-extrabold text-slate-800">
                            {formatMoneda(sol.apoyoControl?.montoTotal || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-[#5E1232] transition-smooth shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Informativo y Acción Global */}
          <div className="p-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between px-4">
            <span className="text-[10px] font-bold text-slate-500">
              {totalAtencion} trámite{totalAtencion === 1 ? '' : 's'} por dictaminar
            </span>
            <button
              onClick={() => {
                navigate('/consultar');
                setIsOpen(false);
              }}
              className="text-xs font-bold text-[#5E1232] hover:text-[#38041a] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver en Expedientes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
