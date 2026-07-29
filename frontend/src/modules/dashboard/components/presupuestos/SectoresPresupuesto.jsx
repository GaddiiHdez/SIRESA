import React from 'react';
import { Sprout, Beef, Fish, Construction, Wrench, AlertTriangle, TrendingUp, Sliders } from 'lucide-react';
import { formatMoneda } from '../../../../shared/utils/formatters';
import { getCurrentUser } from '../../../../shared/services/api';

const SECTOR_INFO = {
  'AGRICULTURA_FRIJOL': { label: 'Agricultura', icon: Sprout, color: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
  'GANADERIA': { label: 'Ganadería', icon: Beef, color: 'bg-amber-600', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  'PESCA_ACUACULTURA': { label: 'Pesca y Acuacultura', icon: Fish, color: 'bg-cyan-500', text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
  'INFRAESTRUCTURA': { label: 'Infraestructura Rural', icon: Construction, color: 'bg-indigo-500', text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
  'MAQUINARIA': { label: 'Maquinaria y Equipamiento', icon: Wrench, color: 'bg-slate-500', text: 'text-slate-600', lightBg: 'bg-slate-50' }
};

export default function SectoresPresupuesto({ modulos, onAdjustPresupuesto, onSelectSector }) {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  // Mostrar permanentemente los 5 sectores clave, incluso si su presupuesto está temporalmente en 0
  const mainSectors = ['AGRICULTURA_FRIJOL', 'GANADERIA', 'PESCA_ACUACULTURA', 'INFRAESTRUCTURA', 'MAQUINARIA'];
  const sectoresPresupuestados = modulos.filter(m => mainSectors.includes(m.modulo));

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div>
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-nayarit-gold" />
            Monitoreo Financiero y Presupuestos
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Avance de inversión respecto al presupuesto anual asignado</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:sm:self-auto">
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdjustPresupuesto && onAdjustPresupuesto();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-nayarit-gold hover:text-nayarit-gold rounded-xl text-[11px] font-bold text-slate-600 transition-smooth shadow-sm cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              Ajustar Presupuestos
            </button>
          )}
          <span className="px-2.5 py-1 bg-nayarit-gold/10 border border-nayarit-gold/25 rounded-full text-nayarit-gold text-[10px] font-bold">
            Ciclo Fiscal 2026
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {sectoresPresupuestados.map(item => {
          const info = SECTOR_INFO[item.modulo] || {
            label: item.modulo,
            icon: TrendingUp,
            color: 'bg-slate-400',
            text: 'text-slate-500',
            lightBg: 'bg-slate-50'
          };
          const asignado = item.presupuestoAsignado;
          const consumido = item.inversion;
          const remanente = Math.max(0, asignado - consumido);
          
          // Porcentaje de consumo
          const porcentaje = asignado > 0 ? (consumido / asignado) * 100 : 0;
          const pctRedondeado = Math.min(100, Math.round(porcentaje));
          const isWarning = porcentaje >= 90;
          
          const Icon = info.icon;

          return (
            <div 
              key={item.modulo} 
              onClick={() => onSelectSector && onSelectSector(item.modulo)}
              className="bg-white rounded-2xl p-4.5 border border-slate-150 flex flex-col justify-between transition-smooth hover:shadow-xs hover:border-nayarit-gold hover:shadow-3xs cursor-pointer"
            >
              {/* Encabezado */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sector</span>
                  <h4 className="font-bold text-slate-800 text-xs md:text-sm mt-0.5 truncate" title={info.label}>
                    {info.label}
                  </h4>
                </div>
                <div className={`p-2 rounded-xl shrink-0 ${info.lightBg} ${info.text}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>

              {/* Números Financieros */}
              <div className="mt-4 space-y-2">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-medium block">Asignado</span>
                  <span className="text-xs font-bold text-slate-500">{formatMoneda(asignado)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-medium block">Consumido</span>
                    <span className={`text-[11px] font-bold ${isWarning ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatMoneda(consumido)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-medium block">Disponible</span>
                    <span className="text-[11px] font-bold text-emerald-600">
                      {formatMoneda(remanente)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso y Alerta */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className={isWarning ? 'text-red-600' : 'text-slate-500'}>
                    Consumo: {pctRedondeado}%
                  </span>
                  {isWarning && (
                    <span className="flex items-center gap-0.5 text-red-600" title="Presupuesto a punto de agotarse">
                      <AlertTriangle className="w-3 h-3" />
                      Límite
                    </span>
                  )}
                </div>
                
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isWarning ? 'bg-red-500' : info.color
                    }`}
                    style={{ width: `${pctRedondeado}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
