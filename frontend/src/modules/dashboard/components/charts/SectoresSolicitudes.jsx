import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { formatModulo } from '../../../../shared/utils/formatters';

export default function SectoresSolicitudes({ modulos, onSelectSector }) {
  // Memoizar el ordenamiento y total de solicitudes
  const { sortedModulos, totalSolicitudes } = useMemo(() => {
    if (!modulos || modulos.length === 0) {
      return { sortedModulos: [], totalSolicitudes: 0 };
    }
    const sorted = [...modulos].sort((a, b) => b.count - a.count);
    const total = modulos.reduce((acc, m) => acc + m.count, 0);
    return { sortedModulos: sorted, totalSolicitudes: total };
  }, [modulos]);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-nayarit-gold" />
            Demanda por Sector Administrativo
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Distribución porcentual de los expedientes ingresados</p>
        </div>
        <span className="text-slate-500 text-xs font-semibold">
          {totalSolicitudes} Trámites
        </span>
      </div>

      <div className="space-y-4.5">
        {sortedModulos.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No hay solicitudes registradas en este periodo.
          </div>
        ) : (
          sortedModulos.map((item, idx) => {
            const porcentaje = totalSolicitudes > 0 
              ? Math.round((item.count / totalSolicitudes) * 100) 
              : 0;
            
            // Variaciones estéticas de color para cada barra
            const barColors = [
              'from-emerald-500 to-teal-500',
              'from-amber-500 to-orange-500',
              'from-cyan-500 to-blue-500',
              'from-indigo-500 to-purple-500',
              'from-slate-500 to-slate-650',
              'from-pink-500 to-rose-500',
              'from-violet-500 to-fuchsia-500'
            ];
            const colorClass = barColors[idx % barColors.length];

            return (
              <div 
                key={item.modulo} 
                onClick={() => onSelectSector && onSelectSector(item.modulo)}
                className="space-y-1.5 group cursor-pointer hover:bg-slate-50/50 p-1.5 -m-1.5 rounded-xl transition-smooth"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 transition-smooth group-hover:text-nayarit-green">
                    {formatModulo(item.modulo)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-bold">{item.count}</span>
                    <span className="text-slate-400 font-medium">({porcentaje}%)</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100/80 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(4, porcentaje)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
