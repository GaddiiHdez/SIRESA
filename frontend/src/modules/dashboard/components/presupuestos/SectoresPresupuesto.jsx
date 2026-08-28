import React from 'react';
import { Sprout, Beef, Fish, Construction, Wrench, AlertTriangle, TrendingUp, Sliders, AlertCircle, Edit3, ArrowUpRight } from 'lucide-react';
import { formatMoneda } from '../../../../shared/utils/formatters';
import { getCurrentUser } from '../../../../shared/services/api';

const SECTOR_INFO = {
  'AGRICULTURA_FRIJOL': { label: 'Agricultura', icon: Sprout, color: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
  'GANADERIA': { label: 'Ganadería', icon: Beef, color: 'bg-amber-600', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  'PESCA_ACUACULTURA': { label: 'Pesca y Acuacultura', icon: Fish, color: 'bg-cyan-500', text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
  'INFRAESTRUCTURA': { label: 'Infraestructura Rural', icon: Construction, color: 'bg-indigo-500', text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
  'MAQUINARIA': { label: 'Maquinaria y Equipamiento', icon: Wrench, color: 'bg-slate-500', text: 'text-slate-600', lightBg: 'bg-slate-50' }
};

export default function SectoresPresupuesto({ modulos = [], onAdjustPresupuesto, onSelectSector }) {
  const currentUser = getCurrentUser();
  // Permitir ajuste a SUPERADMIN y ADMINISTRADOR
  const canEdit = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR';

  // Mostrar permanentemente los 5 sectores oficiales
  const mainSectors = ['AGRICULTURA_FRIJOL', 'GANADERIA', 'PESCA_ACUACULTURA', 'INFRAESTRUCTURA', 'MAQUINARIA'];
  
  // Garantizar que los 5 sectores existan en la lista a renderizar
  const sectoresPresupuestados = mainSectors.map(sectorKey => {
    const existing = modulos.find(m => m.modulo === sectorKey);
    return existing || {
      modulo: sectorKey,
      count: 0,
      inversion: 0,
      presupuestoAsignado: 0
    };
  });

  // Calcular el total asignado para detectar si el presupuesto está sin configurar
  const totalAsignado = sectoresPresupuestados.reduce((sum, item) => sum + (Number(item.presupuestoAsignado) || 0), 0);
  const totalInvertido = sectoresPresupuestados.reduce((sum, item) => sum + (Number(item.inversion) || 0), 0);
  const sinConfigurar = totalAsignado === 0;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-6 border border-slate-200/80 shadow-xs">
      
      {/* Encabezado del Bloque */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-nayarit-burgundy/10 text-nayarit-burgundy rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight flex items-center gap-2">
                Monitoreo Financiero y Presupuestos
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Avance de inversión respecto al presupuesto anual asignado
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdjustPresupuesto && onAdjustPresupuesto();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-nayarit-burgundy hover:bg-[#340719] text-white rounded-xl text-xs font-bold transition-smooth shadow-sm cursor-pointer"
              title="Abrir panel para modificar los montos de presupuesto asignado"
            >
              <Sliders className="w-3.5 h-3.5 text-nayarit-gold" />
              <span>{sinConfigurar ? 'Configurar Presupuestos' : 'Ajustar Presupuestos'}</span>
            </button>
          )}

          <span className="px-3 py-1.5 bg-nayarit-gold/15 border border-nayarit-gold/30 rounded-xl text-nayarit-darkGold text-xs font-extrabold">
            Ciclo Fiscal 2026
          </span>
        </div>
      </div>

      {/* Banner Guía de Estado "Sin Configurar" */}
      {sinConfigurar && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md">
                  Presupuesto Anual No Asignado
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Total Asignado: $0.00 MXN
                </span>
              </div>
              <p className="text-xs text-amber-800/90 font-medium mt-1 leading-relaxed">
                Actualmente los 5 sectores productivos no tienen un techo financiero definido para el ejercicio 2026. 
                {canEdit 
                  ? ' Como Administrador, puedes asignar los presupuestos oficiales para activar el semáforo financiero y el control de disponibilidad.' 
                  : ' Los administradores del sistema aún no han capturado los techos financieros autorizados.'}
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={() => onAdjustPresupuesto && onAdjustPresupuesto()}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shrink-0 transition-smooth flex items-center gap-1.5 shadow-sm cursor-pointer w-full md:w-auto justify-center"
            >
              <Sliders className="w-3.5 h-3.5" />
              Asignar Techos Ahora
            </button>
          )}
        </div>
      )}

      {/* Grid de las 5 Tarjetas Sectoriales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {sectoresPresupuestados.map(item => {
          const info = SECTOR_INFO[item.modulo] || {
            label: item.modulo,
            icon: TrendingUp,
            color: 'bg-slate-400',
            text: 'text-slate-500',
            lightBg: 'bg-slate-50'
          };
          const asignado = Number(item.presupuestoAsignado) || 0;
          const consumido = Number(item.inversion) || 0;
          const hasPresupuesto = asignado > 0;
          const remanente = Math.max(0, asignado - consumido);
          
          // Porcentaje de consumo
          const porcentaje = hasPresupuesto ? (consumido / asignado) * 100 : 0;
          const pctRedondeado = Math.min(100, Math.round(porcentaje));
          const isWarning = hasPresupuesto && porcentaje >= 90;
          
          const Icon = info.icon;

          return (
            <div 
              key={item.modulo} 
              onClick={() => onSelectSector && onSelectSector(item.modulo)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-nayarit-gold/60 cursor-pointer group relative overflow-hidden"
            >
              {/* Encabezado de la Tarjeta */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Sector
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-0.5 truncate group-hover:text-nayarit-burgundy transition-colors" title={info.label}>
                    {info.label}
                  </h4>
                </div>
                <div className={`p-2.5 rounded-xl shrink-0 ${info.lightBg} ${info.text} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Números Financieros */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                      Asignado
                    </span>
                    {hasPresupuesto ? (
                      <span className="text-xs font-black text-slate-800">
                        {formatMoneda(asignado)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block">
                        Sin Asignar
                      </span>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjustPresupuesto && onAdjustPresupuesto();
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-nayarit-burgundy hover:bg-slate-100 rounded-lg transition-all"
                      title="Modificar presupuesto de este sector"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Consumido</span>
                    <span className={`text-[11px] font-black ${isWarning ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatMoneda(consumido)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Disponible</span>
                    <span className={`text-[11px] font-black ${hasPresupuesto ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {hasPresupuesto ? formatMoneda(remanente) : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso y Alerta */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  {hasPresupuesto ? (
                    <>
                      <span className={isWarning ? 'text-red-600' : 'text-slate-500'}>
                        Consumo: {pctRedondeado}%
                      </span>
                      {isWarning && (
                        <span className="flex items-center gap-0.5 text-red-600 font-extrabold" title="Presupuesto a punto de agotarse">
                          <AlertTriangle className="w-3 h-3" />
                          Límite
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 font-semibold italic text-[10px]">
                      Pendiente de techo
                    </span>
                  )}
                </div>
                
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      !hasPresupuesto 
                        ? 'bg-slate-200' 
                        : isWarning 
                          ? 'bg-red-500' 
                          : info.color
                    }`}
                    style={{ width: `${hasPresupuesto ? pctRedondeado : 0}%` }}
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
