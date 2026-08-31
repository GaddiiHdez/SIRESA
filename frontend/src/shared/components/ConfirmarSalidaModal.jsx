import React from 'react';
import { AlertTriangle, Bookmark, ArrowRight, X, Trash2, ShieldAlert } from 'lucide-react';

/**
 * Modal de Advertencia al Intentar Abandonar una Solicitud en Curso
 * 
 * Permite al capturista:
 * 1. Guardar el borrador localmente y salir sin perder datos.
 * 2. Continuar editando (permanecer en la solicitud).
 * 3. Descartar el borrador y salir.
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado con Icono de Advertencia */}
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-6 pb-4 border-b border-amber-200/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 px-2 py-0.5 bg-amber-100/80 rounded-full border border-amber-300">
                  Captura en Progreso
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 font-outfit">
                  ¿Deseas salir de la solicitud?
                </h3>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onStay}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Mensaje */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <p className="leading-relaxed">
            Tienes una solicitud de apoyo en proceso para <strong className="text-slate-900 font-bold">{moduloTitulo || 'este trámite'}</strong>. Si sales ahora sin guardar, podrías perder información capturada.
          </p>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
            <Bookmark className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-snug font-medium">
              Puedes <strong>guardar el borrador</strong> para retomarlo más tarde desde cualquier momento en la pantalla de Nueva Solicitud.
            </p>
          </div>
        </div>

        {/* Opciones de Acción */}
        <div className="p-6 pt-2 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
          {/* Opción 1: Guardar Borrador y Salir (Recomendada) */}
          <button
            type="button"
            onClick={onSaveAndExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#5E1232] hover:bg-[#4a0d27] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#5E1232]/15 cursor-pointer uppercase tracking-wider font-sans"
          >
            <Bookmark className="w-4 h-4 text-amber-300" />
            <span>Guardar Borrador y Salir</span>
          </button>

          {/* Opción 2: Continuar Capturando */}
          <button
            type="button"
            onClick={onStay}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Continuar Editando</span>
          </button>

          {/* Opción 3: Descartar y Salir */}
          <button
            type="button"
            onClick={onDiscardAndExit}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar datos y salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
