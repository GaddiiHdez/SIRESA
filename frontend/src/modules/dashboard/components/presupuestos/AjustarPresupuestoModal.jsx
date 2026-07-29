import React, { useState } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { apiActualizarPresupuesto } from '../../../../shared/services/api';

const SECTOR_LABELS = {
  'AGRICULTURA_FRIJOL': 'Agricultura',
  'GANADERIA': 'Ganadería',
  'PESCA_ACUACULTURA': 'Pesca y Acuacultura',
  'INFRAESTRUCTURA': 'Infraestructura Rural',
  'MAQUINARIA': 'Maquinaria y Equipamiento'
};

export default function AjustarPresupuestoModal({ modulos, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar presupuestos temporales basados en los datos del backend
  const [formBudgets, setFormBudgets] = useState(() => {
    const initial = {};
    Object.keys(SECTOR_LABELS).forEach(key => {
      const dbSector = modulos.find(m => m.modulo === key);
      initial[key] = dbSector ? dbSector.presupuestoAsignado : 0;
    });
    return initial;
  });

  const handleChange = (key, val) => {
    const parsed = val === '' ? '' : parseFloat(val);
    setFormBudgets(prev => ({
      ...prev,
      [key]: parsed
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Guardar todos los presupuestos en paralelo en la BD
      const updatePromises = Object.keys(formBudgets).map(key => {
        const monto = formBudgets[key] === '' ? 0 : formBudgets[key];
        return apiActualizarPresupuesto(key, monto);
      });

      await Promise.all(updatePromises);
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar nuevos presupuestos:', err);
      setError(err.message || 'Error al guardar presupuestos en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-nayarit-dark to-nayarit-green px-6 py-4 flex items-center justify-between text-white">
          <div>
            <span className="text-[10px] bg-nayarit-gold/20 text-nayarit-lightGold px-2.5 py-0.5 rounded-full border border-nayarit-gold/30 font-semibold uppercase tracking-wider">
              ADMINISTRACIÓN
            </span>
            <h3 className="text-base font-bold font-sans mt-1">Reasignar Presupuestos Sectoriales</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-smooth cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-3.5">
            {Object.keys(SECTOR_LABELS).map(key => {
              const label = SECTOR_LABELS[key];
              return (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {label}
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formBudgets[key]}
                      onChange={e => handleChange(key, e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-nayarit-gold"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-smooth cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-nayarit-green hover:bg-nayarit-dark text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
