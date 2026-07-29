import React, { useState, useEffect } from 'react';
import { X, Users, Search, UserCheck, ChevronRight, MapPin, Building, FileText } from 'lucide-react';
import { apiGetProductores } from '../../../../shared/services/api';
import { useNavigate } from 'react-router-dom';

export default function DrawerLateralProductores({ onClose, onSelectSolicitud }) {
  const navigate = useNavigate();
  const [productores, setProductores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiGetProductores();
        setProductores(data || []);
      } catch (err) {
        console.error('Error al obtener lista de productores:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectProducer = (prod) => {
    if (prod.solicitud) {
      // Llamar al callback del padre para abrir el expediente sin cerrar este padrón ni navegar
      onSelectSolicitud && onSelectSolicitud(prod.solicitud.id);
    }
  };

  // Filtrar productores localmente por búsqueda
  const filtered = productores.filter(p => {
    const searchLower = search.toLowerCase();
    if (p.tipoPersona === 'FISICA') {
      const full = `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`.toLowerCase();
      return full.includes(searchLower) || (p.curp && p.curp.toLowerCase().includes(searchLower));
    } else {
      const full = `${p.nombreOrganizacion} ${p.representante}`.toLowerCase();
      return full.includes(searchLower) || (p.rfc && p.rfc.toLowerCase().includes(searchLower));
    }
  });

  return (
    <>
      {/* Overlay translúcido de fondo */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel Deslizable Lateral */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-50 border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between animate-slideInRight">
        
        {/* Cabecera */}
        <div className="bg-white border-b border-slate-150 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Padrón de Beneficiarios</span>
              <h3 className="text-sm md:text-base font-bold text-slate-800 mt-0.5">Productores Registrados</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-xl transition-smooth cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="bg-white px-6 py-3 border-b border-slate-150 shrink-0">
          <div className="relative rounded-xl shadow-3xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, CURP o RFC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Listado de Productores */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-xs text-slate-400 italic">
              No se encontraron productores que coincidan con la búsqueda.
            </div>
          ) : (
            filtered.map(prod => {
              const isFisica = prod.tipoPersona === 'FISICA';
              const name = isFisica 
                ? `${prod.nombre} ${prod.apellidoPaterno} ${prod.apellidoMaterno || ''}`
                : prod.nombreOrganizacion;
              const subtext = isFisica ? `CURP: ${prod.curp || 'No asignada'}` : `RFC: ${prod.rfc || 'No asignada'}`;
              
              return (
                <div 
                  key={prod.id}
                  onClick={() => handleSelectProducer(prod)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 shadow-3xs hover:shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-smooth group"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isFisica ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                      {isFisica ? <UserCheck className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-800 truncate max-w-[220px]" title={name}>
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
                    {prod.solicitud && (
                      <span className="text-[9px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5" title="Ver expediente">
                        <FileText className="w-3 h-3" />
                        {prod.solicitud.folio}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-blue-500 transition-smooth" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-white border-t border-slate-150 p-4 px-6 text-center text-[10px] text-slate-400 font-semibold shrink-0">
          Haz clic en cualquier productor para auditar sus expedientes.
        </div>

      </div>
    </>
  );
}
