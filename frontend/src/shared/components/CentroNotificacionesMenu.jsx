import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileText, AlertCircle, CheckCircle2, Clock, ChevronRight, X } from 'lucide-react';
import { apiGetSolicitudes } from '../services/api';
import { formatMoneda } from '../utils/formatters';

export default function CentroNotificacionesMenu({ onSelectExpediente }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotificaciones();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const data = await apiGetSolicitudes({ limit: 15 });
      if (Array.isArray(data)) {
        // Filtrar o catalogar trámites que requieren atención o ingresaron recientemente
        const pendientes = data.filter(sol => ['REGISTRADA', 'EN REVISIÓN'].includes(sol.status));
        setNotificaciones(pendientes.slice(0, 7));
      }
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const countUnread = notificaciones.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BOTÓN CAMPANA NOTIFICACIONES */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-smooth cursor-pointer border border-slate-200/60"
        title="Centro de Alertas y Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {countUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#5E1232] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
            {countUnread}
          </span>
        )}
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/10 border border-slate-200 z-[999] overflow-hidden animate-scaleUp">
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-[#5E1232] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-nayarit-gold" />
              <span className="font-extrabold text-xs uppercase tracking-wider">Centro de Alertas SIRESA</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition-smooth"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
                Cargando notificaciones...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                ✨ No hay trámites pendientes de dictaminación.
              </div>
            ) : (
              notificaciones.map((sol) => {
                const prodName = sol.productor?.nombreCompleto || sol.productor?.razonSocial || 'Productor Sin Nombre';

                return (
                  <div
                    key={sol.id}
                    onClick={() => {
                      onSelectExpediente(sol.id);
                      setIsOpen(false);
                    }}
                    className="p-3 hover:bg-amber-50/50 rounded-2xl transition-smooth cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-nayarit-gold/15 text-nayarit-dark rounded-xl shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{sol.folio}</span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                          {sol.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">{prodName}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
                        <span>{sol.productor?.municipio || 'Nayarit'}</span>
                        <span className="font-bold text-slate-800">{formatMoneda(sol.apoyoControl?.montoTotal || 0)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-nayarit-gold transition-smooth shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {countUnread} trámites requieren atención de dictaminación
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
