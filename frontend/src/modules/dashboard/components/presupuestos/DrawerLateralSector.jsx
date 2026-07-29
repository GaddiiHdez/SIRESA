import React, { useState, useEffect } from 'react';
import { X, Sprout, Beef, Fish, Construction, Wrench, Wallet, Users, FileSpreadsheet, Calendar, ChevronRight } from 'lucide-react';
import { formatMoneda, formatFecha } from '../../../../shared/utils/formatters';
import { apiGetSolicitudes } from '../../../../shared/services/api';
import { useNavigate } from 'react-router-dom';

const SECTOR_INFO = {
  'AGRICULTURA_FRIJOL': { label: 'Agricultura', icon: Sprout, text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
  'GANADERIA': { label: 'Ganadería', icon: Beef, text: 'text-amber-700', lightBg: 'bg-amber-50' },
  'PESCA_ACUACULTURA': { label: 'Pesca y Acuacultura', icon: Fish, text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
  'INFRAESTRUCTURA': { label: 'Infraestructura Rural', icon: Construction, text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
  'MAQUINARIA': { label: 'Maquinaria y Equipamiento', icon: Wrench, text: 'text-slate-600', lightBg: 'bg-slate-50' }
};

export default function DrawerLateralSector({ sector, modulos, onClose, onSelectSolicitud }) {
  const navigate = useNavigate();
  const [recentSolicitudes, setRecentSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  const info = SECTOR_INFO[sector] || { label: sector, icon: FileSpreadsheet, text: 'text-slate-600', lightBg: 'bg-slate-50' };
  const Icon = info.icon;

  // Encontrar datos presupuestales del sector en la lista de modulos
  const dbSector = modulos.find(m => m.modulo === sector) || { count: 0, inversion: 0, presupuestoAsignado: 0 };

  const asignado = dbSector.presupuestoAsignado;
  const consumido = dbSector.inversion;
  const remanente = Math.max(0, asignado - consumido);
  const porcentaje = asignado > 0 ? Math.round((consumido / asignado) * 100) : 0;

  useEffect(() => {
    async function loadRecent() {
      if (!sector) return;
      setLoading(true);
      try {
        const res = await apiGetSolicitudes({ page: 1, limit: 5, moduloTipo: sector });
        const list = Array.isArray(res) ? res : (res?.solicitudes || []);
        setRecentSolicitudes(list);
      } catch (err) {
        console.error('Error al cargar solicitudes del sector:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecent();
  }, [sector]);

  const handleGestionar = () => {
    // Redirigir a la pantalla de consulta con el filtro de sector en el query param y en el state
    navigate(`/consultar?moduloTipo=${sector}`, { state: { filterModulo: sector } });
    onClose();
  };

  return (
    <>
      {/* Overlay translúcido de fondo */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel Deslizable Lateral */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-50 border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between animate-slideInRight">
        
        {/* Cabecera */}
        <div className="bg-white border-b border-slate-150 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${info.lightBg} ${info.text} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inspección de Sector</span>
              <h3 className="text-sm md:text-base font-bold text-slate-800 mt-0.5">{info.label}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-xl transition-smooth cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Desglose */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Card 1: Balance Presupuestal */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Wallet className="w-4 h-4 text-nayarit-gold" />
              Balance Financiero
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Presupuesto Anual</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 block">{formatMoneda(asignado)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Inversión Consumida</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{formatMoneda(consumido)}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Presupuesto Disponible (Remanente)</span>
                  <span className="text-base font-bold text-emerald-600 mt-0.5 block">{formatMoneda(remanente)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium block">Avance de Consumo</span>
                  <span className="text-base font-bold text-nayarit-green mt-0.5 block">{porcentaje}%</span>
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full rounded-full bg-nayarit-gold" 
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* Card 2: Demanda y Trámites */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs space-y-3.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-nayarit-gold" />
              Resumen de Trámites
            </h4>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Expedientes Totales en Sector</span>
              <span className="text-slate-800 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                {dbSector.count} solicitudes
              </span>
            </div>
          </div>

          {/* Card 3: Últimas Solicitudes Ingresadas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              Últimos Expedientes Ingresados
            </h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-nayarit-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentSolicitudes.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-400 italic">
                No hay expedientes registrados en este sector.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSolicitudes.map(sol => (
                  <div 
                    key={sol.id} 
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-3xs flex items-center justify-between gap-3 transition-smooth hover:border-slate-350"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{sol.folio}</span>
                        <span className="px-2 py-0.25 bg-slate-100 rounded text-[9px] font-bold text-slate-500">
                          {sol.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">
                        Productor: {sol.productor ? (
                          sol.productor.tipoPersona === 'FISICA' 
                            ? `${sol.productor.nombre} ${sol.productor.apellidoPaterno}`
                            : sol.productor.nombreOrganizacion
                        ) : 'General / No asignado'}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Registrado: {formatFecha(sol.fechaRegistro)}
                      </span>
                    </div>
                    <button 
                      onClick={() => onSelectSolicitud && onSelectSolicitud(sol.id)}
                      className="p-1 hover:bg-slate-50 text-slate-400 hover:text-nayarit-gold rounded-lg transition-smooth shrink-0 cursor-pointer"
                      title="Ver expediente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Acciones del Drawer */}
        <div className="bg-white border-t border-slate-150 p-6 shrink-0">
          <button
            onClick={handleGestionar}
            className="w-full py-2.5 px-4 bg-nayarit-green hover:bg-nayarit-dark text-white rounded-2xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            Gestionar Expedientes de este Sector
          </button>
        </div>

      </div>
    </>
  );
}
