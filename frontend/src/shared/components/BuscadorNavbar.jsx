import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, MapPin, ArrowRight } from 'lucide-react';
import { apiGetSolicitudes } from '../services/api';
import { formatMoneda } from '../utils/formatters';

export default function BuscadorNavbar({ onSelectExpediente }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocus = async () => {
    setIsOpen(true);
    if (solicitudes.length === 0) {
      setLoading(true);
      try {
        const data = await apiGetSolicitudes({ limit: 50 });
        setSolicitudes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar solicitudes para buscador:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const results = useMemo(() => {
    if (!query.trim()) return solicitudes.slice(0, 5);
    const q = query.toLowerCase();
    return solicitudes.filter(sol => {
      const folioMatch = sol.folio?.toLowerCase().includes(q);
      const curpMatch = sol.productor?.curp?.toLowerCase().includes(q);
      const rfcMatch = sol.productor?.rfc?.toLowerCase().includes(q);
      const nombreMatch = sol.productor?.nombreCompleto?.toLowerCase().includes(q) || sol.productor?.razonSocial?.toLowerCase().includes(q);
      const muniMatch = sol.productor?.municipio?.toLowerCase().includes(q);
      const sectorMatch = sol.moduloTipo?.toLowerCase().includes(q);
      return folioMatch || curpMatch || rfcMatch || nombreMatch || muniMatch || sectorMatch;
    }).slice(0, 8);
  }, [query, solicitudes]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectExpediente(results[selectedIndex].id);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-64 lg:w-80" ref={containerRef}>
      {/* CAMPO DE ENTRADA REAL EN EL NAVBAR */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={handleFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar Folio, CURP, Nombre..."
          className="w-full pl-9 pr-14 py-2 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-2xl border border-slate-200 focus:border-nayarit-gold focus:ring-2 focus:ring-nayarit-gold/20 transition-all outline-none placeholder:text-slate-400 shadow-2xs"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-0.5 hover:bg-slate-200 rounded-md text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-3 hidden md:inline-flex items-center px-1.5 py-0.5 bg-white text-[9px] font-bold text-slate-400 rounded border border-slate-200 pointer-events-none">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* MENÚ DESPLEGABLE CON RESULTADOS */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[999] overflow-hidden animate-scaleUp">
          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
                Cargando expediente...
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                No hay coincidencias para "{query}"
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
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                      isSelected ? 'bg-nayarit-gold/15 border border-nayarit-gold/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{sol.folio}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded uppercase">
                          {sol.moduloTipo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">{prodName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        {formatMoneda(sol.apoyoControl?.montoTotal || 0)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                        {sol.productor?.municipio || 'Nayarit'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-semibold text-center">
            Presiona <kbd className="px-1 py-0.5 bg-slate-200 text-slate-600 rounded">Enter</kbd> para abrir expediente
          </div>
        </div>
      )}
    </div>
  );
}
