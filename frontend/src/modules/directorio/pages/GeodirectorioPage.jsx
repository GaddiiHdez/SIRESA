import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiGetDirectorioGeo, apiGetSolicitud, apiGetCatalogos, getCurrentUser } from '../../../shared/services/api';
import { Compass, Search, MapPin, Building, Users, Layers, Filter, RefreshCw, Sparkles, ChevronRight, X, Phone, FileText, Download, FileSpreadsheet, BarChart3 } from 'lucide-react';
import MapaDirectorioReal from '../components/MapaDirectorioReal';
import FichaContactoDrawer from '../components/FichaContactoDrawer';
import ExpedienteDetalleModal from '../../solicitudes/components/ExpedienteDetalleModal';
import { toast } from '../../../shared/utils/toast';

export default function GeodirectorioPage() {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogos, setCatalogos] = useState({ municipios: [] });

  // Filtros inicializados con query param si viene de Estadísticas
  const paramMuni = searchParams.get('municipio') || '';
  const [search, setSearch] = useState('');
  const [municipio, setMunicipio] = useState(paramMuni);
  const [capaActiva, setCapaActiva] = useState('ALL'); // 'ALL' | 'PRODUCTOR' | 'UPP' | 'PSG'

  // Selección de Punto para la Ficha Lateral
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  // Sugerencias de Búsqueda Omnibox
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal In-Place de Detalle de Expediente
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newEstatus, setNewEstatus] = useState('');
  const [estatusComentario, setEstatusComentario] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Exportar Excel/CSV de la Ruta de Campo para Personal SEDER
  const handleExportRutaCampo = () => {
    if (!puntos || puntos.length === 0) {
      toast.error('No hay puntos en el mapa para exportar.');
      return;
    }

    const headers = [
      "Municipio",
      "Localidad",
      "Categoria Punto",
      "Folio Expediente",
      "Sector / Modulo",
      "Productor / Razon Social",
      "Tipo Persona",
      "CURP / RFC",
      "Telefono",
      "Domicilio",
      "Predio / UPP",
      "Latitud",
      "Longitud",
      "Enlace Google Maps GPS",
      "Concepto Apoyo",
      "Monto Solicitado",
      "Estatus"
    ];

    const rows = puntos.map(p => {
      const prod = p.productor || {};
      const gan = p.ganaderia || {};
      const ap = p.apoyo || {};
      const coords = p.coordenadas || {};
      const mapsLink = coords.lat && coords.lng ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : '';

      return [
        `"${prod.municipio || gan.municipio || municipio || 'Nayarit'}"`,
        `"${prod.localidad || gan.localidad || ''}"`,
        `"${p.categoriaPunto || 'PRODUCTOR'}"`,
        `"${p.folio || ''}"`,
        `"${p.moduloTipo || ''}"`,
        `"${(prod.nombreCompleto || gan.nombrePredio || 'Sin Nombre').replace(/"/g, '""')}"`,
        `"${prod.tipoPersona || ''}"`,
        `"${prod.curp || prod.rfc || ''}"`,
        `"${prod.telefono || ''}"`,
        `"${(prod.domicilio || '').replace(/"/g, '""')}"`,
        `"${gan.upp || gan.nombrePredio || ''}"`,
        coords.lat || '',
        coords.lng || '',
        `"${mapsLink}"`,
        `"${(ap.concepto || '').replace(/"/g, '""')}"`,
        ap.montoTotal || 0,
        `"${p.status || ''}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const munLabel = municipio ? municipio.replace(/\s+/g, '_') : 'Estatal';
    const filename = `Ruta_Campo_SEDER_${munLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`✓ Exportada Ruta de Campo (${puntos.length} contactos) para ${municipio || 'Nayarit'}`);
  };

  const fetchCatalogos = async () => {
    try {
      const cats = await apiGetCatalogos();
      setCatalogos(cats);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const fetchPuntosGeo = async () => {
    setLoading(true);
    try {
      const res = await apiGetDirectorioGeo({ search, municipio, tipo: capaActiva });
      setPuntos(res.puntos || []);
    } catch (error) {
      console.error('Error al cargar datos del Geodirectorio:', error);
      toast.error('Error al consultar datos cartográficos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
    fetchPuntosGeo();

    // Actualizar título del Navbar institucional
    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        label: "INTELIGENCIA TERRITORIAL",
        title: "GEODIRECTORIO RURAL DE NAYARIT",
        iconKey: "SOLICITUDES",
        actions: [
          { id: "actualizar", text: "Actualizar Mapa" }
        ]
      }
    }));
  }, []);

  // Escuchar acción de actualizar desde el navbar
  useEffect(() => {
    const onActualizar = () => {
      fetchPuntosGeo();
    };
    window.addEventListener('sdr-navbar-action-actualizar', onActualizar);
    return () => {
      window.removeEventListener('sdr-navbar-action-actualizar', onActualizar);
    };
  }, []);

  // Recargar puntos cuando cambie el filtro de municipio o tipo de capa
  useEffect(() => {
    fetchPuntosGeo();
  }, [municipio, capaActiva]);

  // Lista filtrada localmente para sugerencias rápidas del omnibox
  const sugerencias = useMemo(() => {
    if (!search || search.trim().length < 2) return [];
    const q = search.toLowerCase().trim();
    return puntos.filter(p => {
      const nom = p.productor?.nombreCompleto?.toLowerCase() || '';
      const folio = p.folio?.toLowerCase() || '';
      const upp = p.ganaderia?.upp?.toLowerCase() || '';
      const predio = p.ganaderia?.nombrePredio?.toLowerCase() || '';
      return nom.includes(q) || folio.includes(q) || upp.includes(q) || predio.includes(q);
    }).slice(0, 6);
  }, [search, puntos]);

  // Totales calculados para el resumen superior
  const stats = useMemo(() => {
    const totalProductores = puntos.filter(p => p.categoriaPunto === 'PRODUCTOR').length;
    const totalUpp = puntos.filter(p => p.categoriaPunto === 'UPP').length;
    const totalPsg = puntos.filter(p => p.categoriaPunto === 'PSG').length;
    return { total: puntos.length, totalProductores, totalUpp, totalPsg };
  }, [puntos]);

  // Abrir modal de expediente en-sitio
  const handleVerExpediente = async (solId) => {
    setModalLoading(true);
    try {
      const detail = await apiGetSolicitud(solId);
      setSelectedSolicitud(detail);
      setNewEstatus(detail.status);
      setEstatusComentario('');
    } catch (error) {
      console.error('Error al abrir expediente:', error);
      toast.error('Error al cargar el detalle del expediente.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSelectSugerencia = (punto) => {
    setPuntoSeleccionado(punto);
    setSearch(punto.productor?.nombreCompleto || punto.ganaderia?.nombrePredio || punto.folio);
    setShowSuggestions(false);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col p-4 md:p-6 space-y-4 bg-slate-100 overflow-hidden">
      
      {/* ── BARRA SUPERIOR DE BÚSQUEDA OMNIBOX Y ESTADÍSTICAS ─────────────────── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        
        {/* TITULO Y BUSCADOR OMNIBOX */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="bg-gradient-to-br from-nayarit-burgundy to-slate-900 text-white p-3 rounded-2xl shadow-md shrink-0">
            <Compass size={22} className="text-nayarit-gold" />
          </div>

          <div className="relative flex-1 max-w-lg">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Buscar por Productor, UPP, Predio, CURP o Folio..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-nayarit-burgundy focus:ring-2 focus:ring-nayarit-burgundy/10 transition-all"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setShowSuggestions(false); fetchPuntosGeo(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* DROPDOWN DE SUGERENCIAS EN TIEMPO REAL */}
            {showSuggestions && sugerencias.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[3000] overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Resultados encontrados ({sugerencias.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {sugerencias.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectSugerencia(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50/60 flex items-center justify-between transition-all group"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800 group-hover:text-nayarit-burgundy transition-colors">
                          {p.productor?.nombreCompleto || p.ganaderia?.nombrePredio}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{p.productor?.municipio || 'Nayarit'}</span>
                          {p.ganaderia?.upp && <span className="text-emerald-600 font-mono font-bold">UPP: {p.ganaderia.upp}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-nayarit-gold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {p.folio}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SELECTOR DE MUNICIPIO Y CONTADORES */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <select
            value={municipio}
            onChange={e => setMunicipio(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-nayarit-burgundy transition-all"
          >
            <option value="">Todos los Municipios (Estatal)</option>
            {catalogos.municipios?.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* BOTÓN EXPORTAR RUTA DE CAMPO PARA GIRA */}
          <button
            onClick={handleExportRutaCampo}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-[#5E1232] to-[#420921] hover:from-[#430922] hover:to-[#250311] text-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer border border-[#C29A52]/30 active:scale-95"
            title="Exportar itinerario de visitas y contactos con enlaces GPS a Excel/CSV"
          >
            <FileSpreadsheet size={15} className="text-nayarit-gold shrink-0" />
            <span>Exportar Ruta de Campo</span>
          </button>

          {/* BOTÓN ENLACE A ESTADÍSTICAS */}
          <button
            onClick={() => navigate('/estadisticas')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            title="Ver mapa de calor y análisis municipal"
          >
            <BarChart3 size={15} className="text-nayarit-gold shrink-0" />
            <span className="hidden sm:inline">Ver Estadísticas</span>
          </button>

          {/* MÉTRICAS RÁPIDAS */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <MapPin size={14} className="text-nayarit-burgundy" />
            <span>{stats.total} Puntos</span>
          </div>
        </div>
      </div>

      {/* ── CONTENEDOR PRINCIPAL CON MAPA Y DRAWER LATERAL ─────────────────────── */}
      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex">
        
        {/* VISOR DE MAPA LEAFLET */}
        <div className="flex-1 h-full w-full relative">
          {loading && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[1500] flex items-center justify-center flex-col gap-3 text-white">
              <div className="w-8 h-8 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Cargando Capas Cartográficas...</span>
            </div>
          )}

          <MapaDirectorioReal
            puntos={puntos}
            puntoSeleccionado={puntoSeleccionado}
            onSelectPunto={setPuntoSeleccionado}
            capaActiva={capaActiva}
            setCapaActiva={setCapaActiva}
          />
        </div>

        {/* DRAWER LATERAL CON LA FICHA DE CONTACTO DEL PUNTO SELECCIONADO */}
        {puntoSeleccionado && (
          <FichaContactoDrawer
            punto={puntoSeleccionado}
            onClose={() => setPuntoSeleccionado(null)}
            onVerExpediente={handleVerExpediente}
          />
        )}
      </div>

      {/* ── MODAL IN-PLACE PARA DETALLE DE EXPEDIENTE ─────────────────────────── */}
      {selectedSolicitud && (
        <ExpedienteDetalleModal
          solicitud={selectedSolicitud}
          loading={modalLoading}
          onClose={() => setSelectedSolicitud(null)}
          currentUser={currentUser}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          onUpdateEstatus={async (e) => {
            e.preventDefault();
            setUpdateLoading(true);
            try {
              const updated = await apiGetSolicitud(selectedSolicitud.id);
              setSelectedSolicitud(updated);
              toast.success('Estatus actualizado correctamente.');
              fetchPuntosGeo();
            } catch (err) {
              toast.error(err.message);
            } finally {
              setUpdateLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}
