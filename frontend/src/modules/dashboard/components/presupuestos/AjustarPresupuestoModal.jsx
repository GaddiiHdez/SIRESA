import React, { useState } from 'react';
import { X, Save, DollarSign, Info, Calculator, RotateCcw, Sparkles } from 'lucide-react';
import { apiActualizarPresupuesto } from '../../../../shared/services/api';
import { formatMoneda } from '../../../../shared/utils/formatters';

const SECTOR_LABELS = {
  'AGRICULTURA_FRIJOL': { label: 'Agricultura', defaultMonto: 2500000 },
  'GANADERIA': { label: 'Ganadería', defaultMonto: 3000000 },
  'PESCA_ACUACULTURA': { label: 'Pesca y Acuacultura', defaultMonto: 2000000 },
  'INFRAESTRUCTURA': { label: 'Infraestructura Rural', defaultMonto: 5000000 },
  'MAQUINARIA': { label: 'Maquinaria y Equipamiento', defaultMonto: 4000000 }
};

export default function AjustarPresupuestoModal({ modulos = [], onClose, onSuccess, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar presupuestos temporales basados en los datos del backend
  const [formBudgets, setFormBudgets] = useState(() => {
    const initial = {};
    Object.keys(SECTOR_LABELS).forEach(key => {
      const dbSector = modulos.find(m => m.modulo === key);
      initial[key] = dbSector && dbSector.presupuestoAsignado !== undefined ? dbSector.presupuestoAsignado : 0;
    });
    return initial;
  });

  const handleChange = (key, val) => {
    const parsed = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setFormBudgets(prev => ({
      ...prev,
      [key]: parsed
    }));
  };

  const handleCargarSugeridos = () => {
    const defaults = {};
    Object.keys(SECTOR_LABELS).forEach(key => {
      defaults[key] = SECTOR_LABELS[key].defaultMonto;
    });
    setFormBudgets(defaults);
  };

  const handleLimpiarCero = () => {
    const ceros = {};
    Object.keys(SECTOR_LABELS).forEach(key => {
      ceros[key] = 0;
    });
    setFormBudgets(ceros);
  };

  // Suma total en tiempo real
  const totalPresupuesto = Object.values(formBudgets).reduce((acc, val) => {
    return acc + (val === '' ? 0 : Number(val) || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalizar montos antes de enviar
      const payload = {};
      Object.keys(formBudgets).forEach(key => {
        payload[key] = formBudgets[key] === '' ? 0 : Number(formBudgets[key]) || 0;
      });

      // Enviar actualización en lote al servidor
      await apiActualizarPresupuesto(payload);

      if (onSuccess) onSuccess();
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar nuevos presupuestos:', err);
      setError(err.message || 'Error al guardar presupuestos en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scaleIn overflow-hidden border border-slate-100 my-8">
        
        {/* Header Institucional */}
        <div className="bg-gradient-to-r from-nayarit-dark via-[#480C25] to-nayarit-burgundy px-6 py-5 flex items-center justify-between text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-nayarit-gold/25 text-amber-200 px-2.5 py-0.5 rounded-full border border-nayarit-gold/40 font-bold uppercase tracking-wider">
                ADMINISTRACIÓN FINANCIERA
              </span>
              <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded-full font-semibold">
                Ciclo 2026
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold font-sans mt-1.5 text-white">
              Techos Presupuestales por Sector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-smooth cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Guía informativa para el usuario */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
            Define los montos anuales autorizados para cada sector productivo. Estos techos determinan los semáforos de consumo, la disponibilidad y los indicadores de inversión en todo el sistema.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Botones de acción rápida */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Asignación por Sector
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCargarSugeridos}
                className="text-[10px] font-bold text-nayarit-burgundy hover:bg-nayarit-burgundy/10 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Cargar montos sugeridos estándar para el ejercicio fiscal"
              >
                <Sparkles className="w-3 h-3 text-nayarit-gold" />
                Cargar Sugeridos
              </button>
              <button
                type="button"
                onClick={handleLimpiarCero}
                className="text-[10px] font-bold text-slate-500 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Poner todos los montos en $0.00"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            </div>
          </div>

          {/* Lista de sectores */}
          <div className="space-y-3">
            {Object.keys(SECTOR_LABELS).map(key => {
              const item = SECTOR_LABELS[key];
              const valorActual = formBudgets[key];
              return (
                <div key={key} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <label className="text-xs font-bold text-slate-800 block truncate">
                      {item.label}
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {key}
                    </span>
                  </div>
                  <div className="relative w-full sm:w-48 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={valorActual}
                      onChange={e => handleChange(key, e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-nayarit-gold focus:ring-2 focus:ring-nayarit-gold/20 text-right shadow-2xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen Total en Tiempo Real */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 text-nayarit-gold rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Presupuesto Estatal 2026
                </span>
                <span className="text-base sm:text-lg font-black text-white font-sans">
                  {formatMoneda(totalPresupuesto)}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
              5 Sectores
            </span>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-smooth cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-nayarit-burgundy hover:bg-[#340719] text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-nayarit-burgundy/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 text-nayarit-gold" />
                  Guardar Presupuestos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
