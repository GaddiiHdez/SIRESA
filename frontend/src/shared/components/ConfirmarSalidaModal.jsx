import React from 'react';
import { AlertTriangle, Bookmark, X, Trash2 } from 'lucide-react';

/**
 * Modal de Confirmación al Salir de una Solicitud en Curso
 */
export default function ConfirmarSalidaModal({
  isOpen,
  moduloTitulo,
  onSaveAndExit,
  onStay,
  onDiscardAndExit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado */}
        <div className="p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Captura en Progreso
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                ¿Deseas salir de la solicitud?
              </h3>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onStay}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje */}
        <div className="p-5 space-y-3 text-xs text-slate-600">
          <p className="leading-relaxed">
            Hay una solicitud en proceso para <strong className="text-slate-900 font-semibold">{moduloTitulo || 'este sector'}</strong>. Puedes guardar tu avance como borrador para continuarla después.
          </p>
        </div>

        {/* Acciones */}
        <div className="p-5 pt-2 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSaveAndExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5E1232] hover:bg-[#4a0d27] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-amber-300" />
            <span>Guardar Borrador y Salir</span>
          </button>

          <button
            type="button"
            onClick={onStay}
            className="w-full flex items-center justify-center px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Continuar Capturando
          </button>

          <button
            type="button"
            onClick={onDiscardAndExit}
            className="w-full flex items-center justify-center gap-1 px-4 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar datos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

