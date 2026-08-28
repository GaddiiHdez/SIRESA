import React, { useState, useEffect } from 'react';
import { X, Users, Search, UserCheck, ChevronRight, MapPin, Building, FileText, ArrowUpRight } from 'lucide-react';
import { apiGetProductores } from '../../../../shared/services/api';
import { useNavigate } from 'react-router-dom';

export default function DrawerLateralProductores({ onClose, onOpenDetail, onSelectSolicitud }) {
  const navigate = useNavigate();
  const [productores, setProductores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const handleOpenExpediente = onOpenDetail || onSelectSolicitud;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isMounted) setLoading(true);
      try {
        const data = await apiGetProductores();
        if (isMounted) {
          setProductores(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error al obtener lista de productores:', err);
        if (isMounted) {
          setProductores([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectProducer = (prod) => {
    const solicitudes = prod.solicitudes || (prod.solicitud ? [prod.solicitud] : []);
    if (solicitudes.length > 0 && handleOpenExpediente) {
      handleOpenExpediente(solicitudes[0].id);
    }
  };

  // Filtrar productores localmente por búsqueda
  const filtered = productores.filter(p => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    if (p.tipoPersona === 'FISICA') {
      const full = `${p.nombre || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
      return full.includes(searchLower) || (p.curp && p.curp.toLowerCase().includes(searchLower)) || (p.rfc && p.rfc.toLowerCase().includes(searchLower));
    } else {
      const full = `${p.nombreOrganizacion || ''} ${p.representante || ''}`.toLowerCase();
      return full.includes(searchLower) || (p.rfc && p.rfc.toLowerCase().includes(searchLower));
    }
  });

  return (
    <>
      {/* Overlay translúcido de fondo */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-45 transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel Deslizable Lateral */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-50 border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between animate-slideInRight">
        
        {/* Cabecera */}
        <div className="bg-white border-b border-slate-150 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Padrón de Beneficiarios</span>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-0.5">Productores Registrados</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-smooth cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-150 shrink-0">
          <div className="relative rounded-xl shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, CURP o RFC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-nayarit-gold focus:ring-2 focus:ring-nayarit-gold/20 transition-all"
            />
          </div>
        </div>

        {/* Listado de Productores */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-400">Cargando padrón de productores...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No se encontraron productores</p>
              <p className="text-[11px] text-slate-400">Verifica el término de búsqueda o limpia el filtro.</p>
            </div>
          ) : (
            filtered.map(prod => {
              const isFisica = prod.tipoPersona === 'FISICA';
              const name = isFisica 
                ? `${prod.nombre || ''} ${prod.apellidoPaterno || ''} ${prod.apellidoMaterno || ''}`.trim()
                : prod.nombreOrganizacion;
              const subtext = isFisica ? `CURP: ${prod.curp || 'No asignada'}` : `RFC: ${prod.rfc || 'No asignada'}`;
              const solicitudes = prod.solicitudes || (prod.solicitud ? [prod.solicitud] : []);
              
              return (
                <div 
                  key={prod.id}
                  onClick={() => handleSelectProducer(prod)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-purple-300 shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all group"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isFisica ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                      {isFisica ? <UserCheck className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate max-w-[200px]" title={name}>
                          {name}
                        </h4>
                        <span className={`px-1.5 py-0.25 rounded text-[8px] font-bold ${
                          isFisica ? 'bg-emerald-100/50 text-emerald-700' : 'bg-purple-100/50 text-purple-700'
                        }`}>
                          {isFisica ? 'Física' : 'Moral'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{subtext}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{prod.localidad}, {prod.municipio}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {solicitudes.length > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        {solicitudes.slice(0, 2).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (handleOpenExpediente) handleOpenExpediente(s.id);
                            }}
                            className="text-[9px] bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors"
                            title="Abrir este expediente"
                          >
                            <FileText className="w-3 h-3" />
                            {s.folio}
                          </button>
                        ))}
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-purple-600 transition-smooth" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & action */}
        <div className="bg-white border-t border-slate-150 p-4 px-6 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold">
            {filtered.length} productores listados
          </span>
          <button
            onClick={() => {
              navigate('/productores');
              onClose();
            }}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Ir al Padrón Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </>
  );
}
