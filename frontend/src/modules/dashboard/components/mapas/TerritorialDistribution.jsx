import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { formatMoneda } from '../../../../shared/utils/formatters';

export default function TerritorialDistribution({ municipios }) {
  const maxInversion = useMemo(() => {
    if (!municipios || municipios.length === 0) return 0;
    return Math.max(...municipios.map(m => m.inversion));
  }, [municipios]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4.5 h-4.5 text-nayarit-gold" />
          Distribución Territorial de Apoyos (Nayarit)
        </h3>
        <span className="text-slate-400 text-xs">Ordenado por presupuesto asignado</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Municipio</th>
              <th className="py-3 px-4 text-center">N° Solicitudes</th>
              <th className="py-3 px-4 text-right">Monto Total Solicitado</th>
              <th className="py-3 px-4 text-center">Estado Visual</th>
            </tr>
          </thead>
          <tbody>
            {municipios.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-slate-400">No hay datos territoriales capturados.</td>
              </tr>
            ) : (
              municipios.map((item) => {
                const percentOfMax = maxInversion > 0 ? (item.inversion / maxInversion) * 100 : 0;

                return (
                  <tr key={item.municipio} className="border-b border-slate-50 hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{item.municipio}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{item.count}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">{formatMoneda(item.inversion)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-nayarit-gold rounded-full" 
                            style={{ width: `${percentOfMax}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
