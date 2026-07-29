import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, User, MapPin, Calendar, ArrowRight, CornerDownLeft } from 'lucide-react';
import { apiGetSolicitudes } from '../services/api';
import { formatMoneda } from '../utils/formatters';

export default function BuscadorOmniboxModal({ isOpen, onClose, onSelectExpediente }) {
  const [query, setQuery] = useState('');
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadAllSolicitudes();
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const loadAllSolicitudes = async () => {
    setLoading(true);
    try {
      const data = await apiGetSolicitudes({ limit: 50 });
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar solicitudes para omnibox:", err);
    } finally {
      setLoading(false);
    }
  };

  const results = useMemo(() => {
    if (!query.trim()) return solicitudes.slice(0, 5); // Sugerir las 5 más recientes por defecto
    const q = query.toLowerCase();
    return solicitudes.filter(sol => {
      const folioMatch = sol.folio?.toLowerCase().includes(q);
      const curpMatch = sol.productor?.curp?.toLowerCase().includes(q);
      const rfcMatch = sol.productor?.rfc?.toLowerCase().includes(q);
      const nombreMatch = sol.productor?.nombreCompleto?.toLowerCase().includes(q) || sol.productor?.razonSocial?.toLowerCase().includes(q);
      const muniMatch = sol.productor?.municipio?.toLowerCase().includes(q);
      const sectorMatch = sol.moduloTipo?.toLowerCase().includes(q);
      return folioMatch || curpMatch || rfcMatch || nombreMatch || muniMatch || sectorMatch;
    }).slice(0, 10);
  }, [query, solicitudes]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectExpediente(results[selectedIndex].id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onKeyDown={handleKeyDown}
      >
        {/* BARRA DE ENTRADA OMNIBOX */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-nayarit-gold shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por Folio (ej. SDR-NY-2026), CURP, Nombre o Municipio..."
            className="w-full bg-transparent text-sm md:text-base font-semibold text-slate-800 focus:outline-none placeholder:text-slate-400"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 text-xs"
            >
              Limpiar
            </button>
          )}
          <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-[10px] font-bold text-slate-500 rounded-lg shrink-0">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-smooth md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LISTA DE RESULTADOS DE BÚSQUEDA */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-100 space-y-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
              Buscando en la base de datos...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No se encontraron expedientes que coincidan con <strong className="text-slate-700">"{query}"</strong>
            </div>
          ) : (
            results.map((sol, index) => {
              const isSelected = index === selectedIndex;
              const prodName = sol.productor?.nombreCompleto || sol.productor?.razonSocial || 'Productor Sin Nombre';

              return (
                <div
                  key={sol.id}
                  onClick={() => {
                    onSelectExpediente(sol.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3.5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-smooth ${
                    isSelected ? 'bg-nayarit-gold/15 border border-nayarit-gold/40 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${isSelected ? 'bg-[#5E1232]' : 'bg-slate-700'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs md:text-sm text-slate-900 tracking-tight">{sol.folio}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                          {sol.moduloTipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 truncate">
                        <span className="font-semibold text-slate-700 truncate">{prodName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <MapPin className="w-3 h-3 text-nayarit-gold" />
                          {sol.productor?.municipio || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        {formatMoneda(sol.apoyoControl?.montoTotal || 0)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">
                        {sol.status}
                      </span>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-smooth ${isSelected ? 'text-[#5E1232] translate-x-1' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PIE DE PÁGINA CON INSTRUCCIONES */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold px-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">↑↓</kbd> Navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">↵</kbd> Abrir Expediente
            </span>
          </div>
          <span>Búsqueda Inteligente SIRESA</span>
        </div>
      </div>
    </div>
  );
}
