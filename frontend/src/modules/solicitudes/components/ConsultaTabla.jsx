import React from 'react';
import { Eye, ClipboardCheck } from 'lucide-react';
import { formatMoneda, formatModulo } from '../../../shared/utils/formatters';
import { STATUS_COLORS } from '../../../shared/utils/statusColors';

export default function ConsultaTabla({ solicitudes, loading, handleOpenDetail, onExportExcel }) {
  const getStatusBadge = (stat) => {
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[stat] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {stat}
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200/80">
      {/* BARRA SUPERIOR DE ACCIONES DE LA TABLA */}
      {!loading && solicitudes.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nayarit-gold" />
            <span className="text-xs font-bold text-slate-700">
              Mostrando <strong className="text-slate-900 font-extrabold">{solicitudes.length}</strong> expedientes encontrados
            </span>
          </div>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-smooth shadow-2xs cursor-pointer uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
            title="Descargar sábana de datos en formato Excel/CSV"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar a Excel</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-3 border-nayarit-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-sm font-medium">No se encontraron expedientes con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Folio</th>
                <th className="py-4 px-6">Productor</th>
                <th className="py-4 px-6">Sector / Módulo</th>
                <th className="py-4 px-6">Ubicación</th>
                <th className="py-4 px-6 text-right">Inversión</th>
                <th className="py-4 px-6 text-center">Estatus</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(sol => (
                <tr key={sol.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-smooth">
                  <td className="py-4 px-6 font-bold text-slate-800">{sol.folio}</td>
                  <td className="py-4 px-6">
                    {sol.productor ? (
                      <>
                        <div className="font-semibold text-slate-700">
                          {sol.productor.tipoPersona === 'FISICA' 
                            ? `${sol.productor.nombre} ${sol.productor.apellidoPaterno}` 
                            : sol.productor.nombreOrganizacion}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {sol.productor.tipoPersona === 'FISICA' ? `CURP: ${sol.productor.curp}` : `Org - Rep: ${sol.productor.representante}`}
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400 text-xs italic font-medium">
                        Registro Informativo / Difusión
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-700">{formatModulo(sol.moduloTipo)}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={sol.programa}>
                      {sol.componente}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {sol.productor ? (
                      <>
                        <div className="font-semibold text-slate-600">{sol.productor.municipio}</div>
                        <div className="text-[10px] text-slate-400">{sol.productor.localidad}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-slate-600">
                          {sol.datosMedios?.municipio || 'Estatal'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sol.datosMedios?.localidad || 'Nayarit'}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-slate-800">
                    {sol.apoyoControl ? formatMoneda(sol.apoyoControl.montoTotal) : 'No aplica'}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(sol.status)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleOpenDetail(sol.id)}
                      className="p-2 bg-slate-100 hover:bg-nayarit-gold/20 hover:text-nayarit-gold text-slate-500 rounded-lg transition-smooth cursor-pointer"
                      title="Ver detalle del expediente"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
