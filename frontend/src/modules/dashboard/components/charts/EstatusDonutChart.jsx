import React from 'react';
import { STATUS_DOT_COLORS, STATUS_HEX_COLORS } from '../../../../shared/utils/statusColors';

export default function EstatusDonutChart({ estatus, totalSolicitudes }) {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
      <div className="space-y-1">
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
          Estado de Trámites
        </h3>
        <p className="text-slate-400 text-xs">Porcentaje de solicitudes registradas</p>
      </div>

      <div className="flex items-center justify-center my-6 relative">
        <svg width="180" height="180" viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
          {(() => {
            let accumulatedPercent = 0;
            const totalEstatusCount = estatus.reduce((acc, curr) => acc + curr.count, 0);

            return estatus.map((item, idx) => {
              const pct = totalEstatusCount > 0 ? (item.count / totalEstatusCount) * 100 : 0;
              const strokeDasharray = `${pct} ${100 - pct}`;
              const strokeDashoffset = 100 - accumulatedPercent + 25;
              accumulatedPercent += pct;

              return (
                <circle
                  key={item.status}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke={STATUS_HEX_COLORS[item.status] || '#cbd5e1'}
                  strokeWidth="3.2"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              );
            });
          })()}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-800">{totalSolicitudes}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
        {estatus.map(item => {
          return (
            <div key={item.status} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[item.status] || 'bg-slate-300'}`} />
              <span className="truncate">{item.status}: <strong>{item.count}</strong></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
