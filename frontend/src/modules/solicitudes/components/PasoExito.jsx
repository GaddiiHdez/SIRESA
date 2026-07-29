import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function PasoExito({ successFolio, registradoPor, onReset, onGoToList }) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-10 animate-scaleIn">
      <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mx-auto transform hover:scale-105 transition-smooth">
        <CheckCircle className="w-14 h-14 text-white" />
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
          ¡Solicitud Registrada Exitosamente!
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          El expediente ha sido persistido y se ha generado su número de seguimiento oficial de la Secretaría.
        </p>
      </div>

      {/* Tarjeta de Folio */}
      <div className="glass-card rounded-2xl p-6 bg-slate-50 border border-slate-100 max-w-sm mx-auto space-y-4">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Folio Generado</span>
          <span className="text-2xl font-black text-nayarit-dark font-sans tracking-wide mt-1 block">
            {successFolio}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Registrado por: <strong>{registradoPor || 'Funcionario'}</strong> • Nayarit, Mex.
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onReset}
          className="px-6 py-3 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-smooth shadow-sm"
        >
          Registrar Otra Solicitud
        </button>
        <button
          onClick={onGoToList}
          className="px-6 py-3 bg-nayarit-green hover:bg-nayarit-dark text-white font-semibold text-sm rounded-xl transition-smooth shadow-md shadow-nayarit-green/10"
        >
          Ir al Listado de Solicitudes
        </button>
      </div>
    </div>
  );
}
