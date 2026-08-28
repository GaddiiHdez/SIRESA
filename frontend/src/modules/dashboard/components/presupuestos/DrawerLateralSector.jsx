import React, { useState, useEffect } from 'react';
import { X, Sprout, Beef, Fish, Construction, Wrench, Wallet, FileSpreadsheet, Calendar, ChevronRight, AlertCircle, FileText, ArrowUpRight } from 'lucide-react';
import { formatMoneda, formatFecha, formatModulo } from '../../../../shared/utils/formatters';
import { apiGetSolicitudes } from '../../../../shared/services/api';
import { useNavigate } from 'react-router-dom';

const SECTOR_INFO = {
  'AGRICULTURA_FRIJOL': { label: 'Agricultura', icon: Sprout, text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
  'GANADERIA': { label: 'Ganadería', icon: Beef, text: 'text-amber-700', lightBg: 'bg-amber-50' },
  'PESCA_ACUACULTURA': { label: 'Pesca y Acuacultura', icon: Fish, text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
  'INFRAESTRUCTURA': { label: 'Infraestructura Rural', icon: Construction, text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
  'MAQUINARIA': { label: 'Maquinaria y Equipamiento', icon: Wrench, text: 'text-slate-600', lightBg: 'bg-slate-50' },
  'MEDIOS': { label: 'Información de Medios', icon: FileSpreadsheet, text: 'text-rose-600', lightBg: 'bg-rose-50' },
  'TEMAS_IMPORTANTES': { label: 'Temas de Importancia', icon: FileSpreadsheet, text: 'text-purple-600', lightBg: 'bg-purple-50' }
};

export default function DrawerLateralSector({ sector, sectorKey, modulos = [], onClose, onOpenDetail, onSelectSolicitud }) {
  const navigate = useNavigate();
  const [recentSolicitudes, setRecentSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Soporta tanto prop 'sector' como 'sectorKey'
  const activeSector = sector || sectorKey;
  const handleOpenExpediente = onOpenDetail || onSelectSolicitud;

  const info = SECTOR_INFO[activeSector] || { 
    label: formatModulo(activeSector) || activeSector || 'Sector', 
    icon: FileSpreadsheet, 
    text: 'text-slate-600', 
    lightBg: 'bg-slate-50' 
  };
  const Icon = info.icon;

  // Encontrar datos presupuestales del sector en la lista de modulos
  const dbSector = modulos.find(m => m.modulo === activeSector) || { count: 0, inversion: 0, presupuestoAsignado: 0 };

  const asignado = Number(dbSector.presupuestoAsignado) || 0;
  const consumido = Number(dbSector.inversion) || 0;
  const remanente = Math.max(0, asignado - consumido);
  const hasPresupuesto = asignado > 0;
  const porcentaje = hasPresupuesto ? Math.min(100, Math.round((consumido / asignado) * 100)) : 0;

  useEffect(() => {
    let isMounted = true;

    async function loadRecent() {
      if (!activeSector) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setLoading(true);

      try {
        const res = await apiGetSolicitudes({ page: 1, limit: 10, moduloTipo: activeSector });
        const list = Array.isArray(res) ? res : (res?.solicitudes || []);
        if (isMounted) {
          setRecentSolicitudes(list);
        }
      } catch (err) {
        console.error('Error al cargar solicitudes del sector:', err);
        if (isMounted) {
          setRecentSolicitudes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRecent();

    return () => {
      isMounted = false;
    };
  }, [activeSector]);

  const handleGestionar = () => {
    // Redirigir a la pantalla de consulta con el filtro de sector
    navigate(`/consultar?moduloTipo=${activeSector}`, { state: { filterModulo: activeSector } });
    onClose();
  };

  return (
    <>
      {/* Overlay translúcido de fondo */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel Deslizable Lateral */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-50 border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between animate-slideInRight">
        
        {/* Cabecera */}
        <div className="bg-white border-b border-slate-150 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${info.lightBg} ${info.text} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Inspección de Sector
              </span>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-0.5">
                {info.label}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-smooth cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Desglose */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Card 1: Balance Presupuestal */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-nayarit-gold" />
                Balance Financiero
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                Ciclo 2026
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Presupuesto Anual</span>
                {hasPresupuesto ? (
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">{formatMoneda(asignado)}</span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block mt-0.5">
                    Sin Techo Asignado
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inversión Consumida</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{formatMoneda(consumido)}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Presupuesto Disponible</span>
                  <span className={`text-base font-black mt-0.5 block ${hasPresupuesto ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hasPresupuesto ? formatMoneda(remanente) : '$0.00'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avance de Consumo</span>
                  <span className="text-base font-black text-nayarit-burgundy mt-0.5 block">
                    {hasPresupuesto ? `${porcentaje}%` : 'N/D'}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${hasPresupuesto ? 'bg-nayarit-burgundy' : 'bg-slate-200'}`} 
                style={{ width: `${hasPresupuesto ? porcentaje : 0}%` }}
              />
            </div>
          </div>

          {/* Card 2: Demanda y Trámites */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-nayarit-gold" />
                Expedientes Totales en este Sector
              </span>
              <span className="text-slate-900 font-black bg-slate-100 px-3 py-1 rounded-full text-xs">
                {dbSector.count || recentSolicitudes.length} {((dbSector.count || recentSolicitudes.length) === 1) ? 'solicitud' : 'solicitudes'}
              </span>
            </div>
          </div>

          {/* Card 3: Últimas Solicitudes Ingresadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Últimos Expedientes Ingresados
              </h4>
              {!loading && recentSolicitudes.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  Mostrando {recentSolicitudes.length}
                </span>
              )}
            </div>
            
            {loading ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 border-3 border-nayarit-burgundy border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-400">Cargando expedientes del sector...</span>
              </div>
            ) : recentSolicitudes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No hay expedientes registrados en este sector</p>
                <p className="text-[11px] text-slate-400">Las solicitudes registradas aparecerán listadas aquí para su inspección rápida.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSolicitudes.map(sol => {
                  const productorNombre = sol.productor ? (
                    sol.productor.tipoPersona === 'FISICA' 
                      ? `${sol.productor.nombre || ''} ${sol.productor.apellidoPaterno || ''}`.trim()
                      : sol.productor.nombreOrganizacion
                  ) : 'General / No asignado';

                  return (
                    <div 
                      key={sol.id} 
                      onClick={() => handleOpenExpediente && handleOpenExpediente(sol.id)}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-nayarit-gold/60 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 group-hover:text-nayarit-burgundy transition-colors">
                            {sol.folio}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                            {sol.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-semibold block mt-1 truncate">
                          {productorNombre}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-medium">
                          {sol.productor?.municipio && (
                            <span>{sol.productor.municipio}</span>
                          )}
                          <span>Reg: {formatFecha(sol.fechaRegistro)}</span>
                        </div>
                      </div>
                      
                      <div className="p-2 bg-slate-50 group-hover:bg-nayarit-burgundy/10 text-slate-400 group-hover:text-nayarit-burgundy rounded-xl transition-all shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Acciones del Drawer */}
        <div className="bg-white border-t border-slate-150 p-5 shrink-0">
          <button
            onClick={handleGestionar}
            className="w-full py-3 px-4 bg-nayarit-burgundy hover:bg-[#340719] text-white rounded-xl text-xs font-extrabold transition-smooth flex items-center justify-center gap-2 shadow-md shadow-nayarit-burgundy/20 cursor-pointer"
          >
            <span>Gestionar Todos los Expedientes del Sector</span>
            <ArrowUpRight className="w-4 h-4 text-nayarit-gold" />
          </button>
        </div>

      </div>
    </>
  );
}
