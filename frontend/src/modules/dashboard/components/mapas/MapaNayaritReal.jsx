import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, DollarSign, FileText, ChevronRight } from 'lucide-react';
import { formatMoneda } from '../../../../shared/utils/formatters';
import { useNavigate } from 'react-router-dom';

// Coordenadas geográficas reales (Latitud, Longitud) de los 20 municipios de Nayarit
const MUNICIPIOS_COORDS = [
  { id: 'Tepic', name: 'Tepic', lat: 21.5039, lng: -104.8947 },
  { id: 'Santiago Ixcuintla', name: 'Santiago Ixcuintla', lat: 21.8108, lng: -105.2081 },
  { id: 'Compostela', name: 'Compostela', lat: 21.2361, lng: -104.9008 },
  { id: 'Bahía de Banderas', name: 'Bahía de Banderas', lat: 20.8000, lng: -105.2500 },
  { id: 'Acaponeta', name: 'Acaponeta', lat: 22.4964, lng: -105.3597 },
  { id: 'Tecuala', name: 'Tecuala', lat: 22.3983, lng: -105.4583 },
  { id: 'Rosamorada', name: 'Rosamorada', lat: 22.1222, lng: -105.2056 },
  { id: 'Tuxpan', name: 'Tuxpan', lat: 21.9422, lng: -105.2958 },
  { id: 'San Blas', name: 'San Blas', lat: 21.5408, lng: -105.2853 },
  { id: 'Xalisco', name: 'Xalisco', lat: 21.4458, lng: -104.8986 },
  { id: 'Ruíz', name: 'Ruíz', lat: 21.9500, lng: -105.1431 },
  { id: 'Huajicori', name: 'Huajicori', lat: 22.6347, lng: -105.3189 },
  { id: 'Del Nayar', name: 'Del Nayar', lat: 22.2472, lng: -104.5822 },
  { id: 'La Yesca', name: 'La Yesca', lat: 21.3189, lng: -104.0139 },
  { id: 'Santa María del Oro', name: 'Santa María del Oro', lat: 21.3339, lng: -104.5861 },
  { id: 'San Pedro Lagunillas', name: 'San Pedro Lagunillas', lat: 21.2189, lng: -104.7522 },
  { id: 'Jala', name: 'Jala', lat: 21.1689, lng: -104.4339 },
  { id: 'Ahuacatlán', name: 'Ahuacatlán', lat: 21.0539, lng: -104.4836 },
  { id: 'Ixtlán del Río', name: 'Ixtlán del Río', lat: 21.0369, lng: -104.3717 },
  { id: 'Amatlán de Cañas', name: 'Amatlán de Cañas', lat: 20.8061, lng: -104.4039 }
];

export default function MapaNayaritReal({ municipios = [] }) {
  const navigate = useNavigate();
  const [selectedMuni, setSelectedMuni] = useState(null);

  // Mapeo rápido de datos de la API por municipio
  const dataMap = useMemo(() => {
    const map = {};
    municipios.forEach(m => {
      map[m.municipio] = m;
    });
    return map;
  }, [municipios]);

  // Máxima inversión para calcular radio y escala de color proporcional
  const maxInversion = useMemo(() => {
    if (!municipios || municipios.length === 0) return 0;
    return Math.max(...municipios.map(m => Number(m.inversion) || 0));
  }, [municipios]);

  // Determinar estilo del marcador (radio y color)
  const getMarkerStyle = (muniName) => {
    const data = dataMap[muniName];
    if (!data || Number(data.inversion) === 0) {
      return { radius: 10, fillColor: '#94A3B8', color: '#64748B', weight: 1.5, fillOpacity: 0.4 };
    }
    const ratio = maxInversion > 0 ? (Number(data.inversion) / maxInversion) : 0;

    if (ratio > 0.6) {
      return { radius: 22, fillColor: '#5E1232', color: '#C29A52', weight: 3, fillOpacity: 0.85 };
    }
    if (ratio > 0.25) {
      return { radius: 17, fillColor: '#8C1F48', color: '#E3B868', weight: 2.5, fillOpacity: 0.8 };
    }
    return { radius: 13, fillColor: '#C29A52', color: '#5E1232', weight: 2, fillOpacity: 0.85 };
  };

  const handleMuniClick = (muniName) => {
    setSelectedMuni(muniName);
    navigate(`/consultar?municipio=${encodeURIComponent(muniName)}`, {
      state: {
        filterMunicipio: muniName,
        titleLabel: `Expedientes en el Municipio de ${muniName}`
      }
    });
  };

  const activeData = selectedMuni ? dataMap[selectedMuni] : null;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm animate-fadeIn">
      {/* Encabezado del Mapa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <span className="px-3 py-1 bg-nayarit-gold/10 text-nayarit-gold border border-nayarit-gold/25 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Mapa Cartográfico Oficial
          </span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Distribución Territorial de Apoyos (Nayarit)
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Cartografía oficial interactiva. Selecciona cualquier municipio para consultar su desglose por localidades y expedientes.
          </p>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/60 shrink-0">
          <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Intensidad:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#5E1232] border border-[#C29A52]" />
            <span className="text-[11px] font-medium">Alta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#8C1F48] border border-[#E3B868]" />
            <span className="text-[11px] font-medium">Media</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#C29A52] border border-[#5E1232]" />
            <span className="text-[11px] font-medium">Baja</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* CONTENEDOR DEL MAPA REAL LEAFLET */}
        <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-md min-h-[480px] h-full flex flex-col">
          <MapContainer
            center={[21.7587, -104.8409]}
            zoom={8}
            scrollWheelZoom={false}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {MUNICIPIOS_COORDS.map((muni) => {
              const style = getMarkerStyle(muni.name);
              const data = dataMap[muni.name];

              return (
                <CircleMarker
                  key={muni.id}
                  center={[muni.lat, muni.lng]}
                  radius={style.radius}
                  pathOptions={{
                    fillColor: style.fillColor,
                    color: style.color,
                    weight: style.weight,
                    fillOpacity: style.fillOpacity
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedMuni(muni.name);
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div className="font-sans text-xs p-1">
                      <strong className="block text-slate-900 font-bold text-sm">{muni.name}</strong>
                      <span className="text-slate-600 font-semibold block mt-0.5">
                        {data ? `${data.count} expediente(s)` : 'Sin trámites'}
                      </span>
                      <span className="text-nayarit-gold font-bold block mt-0.5">
                        {formatMoneda(data ? data.inversion : 0)}
                      </span>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="font-sans text-xs p-1 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900 border-b pb-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-nayarit-gold" />
                        {muni.name}
                      </h4>
                      <p className="text-slate-600">
                        Expedientes: <strong className="text-slate-900">{data ? data.count : 0}</strong>
                      </p>
                      <p className="text-slate-600">
                        Inversión: <strong className="text-nayarit-dark">{formatMoneda(data ? data.inversion : 0)}</strong>
                      </p>
                      <button
                        onClick={() => handleMuniClick(muni.name)}
                        className="w-full mt-2 px-3 py-1.5 bg-[#5E1232] text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-[#480c25] transition-smooth cursor-pointer"
                      >
                        Ver Expedientes en {muni.name}
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-bold shadow-sm z-10">
            📍 Estado de Nayarit (20 Municipios)
          </div>
        </div>

        {/* DETALLE LATERAL DEL MUNICIPIO SELECCIONADO Y LOCALIDADES */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-[#5E1232] text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-white/10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-nayarit-gold/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-[10px] bg-nayarit-gold/20 text-nayarit-lightGold px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-nayarit-gold/30">
                Información del Municipio
              </span>
              <span className="text-xs text-slate-400 font-medium">Nayarit 2026</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Municipio Seleccionado</span>
                <h3 className="text-2xl font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-nayarit-gold" />
                  {selectedMuni || 'Selecciona un Municipio'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Expedientes</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {activeData ? activeData.count : 0}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Solicitudes en sistema</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Monto Solicitado</span>
                  <span className="text-xl font-bold text-nayarit-lightGold mt-1 block">
                    {formatMoneda(activeData ? activeData.inversion : 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Presupuesto solicitado</span>
                </div>
              </div>

              {/* DESGLOSE POR LOCALIDADES DEL MUNICIPIO */}
              {selectedMuni && activeData?.localidades && activeData.localidades.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-nayarit-lightGold uppercase tracking-wider block">
                    📍 Desglose por Localidades en {selectedMuni}:
                  </span>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {activeData.localidades.map((loc) => (
                      <div 
                        key={loc.localidad}
                        className="flex items-center justify-between p-2 bg-white/10 rounded-xl text-xs border border-white/5"
                      >
                        <span className="font-semibold text-white">{loc.localidad}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 text-[11px]">{loc.count} solic.</span>
                          <span className="font-bold text-nayarit-lightGold">{formatMoneda(loc.inversion)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMuni && (
                <div className="pt-2">
                  <button
                    onClick={() => handleMuniClick(selectedMuni)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-nayarit-gold hover:bg-[#e3b868] text-[#200210] rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-smooth shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Consultar Expedientes en {selectedMuni}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Municipios */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 max-h-[220px] overflow-y-auto space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
              Top Municipios por Inversión
            </span>
            {municipios.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No hay solicitudes registradas.</p>
            ) : (
              municipios.map((item) => (
                <div 
                  key={item.municipio}
                  onClick={() => {
                    setSelectedMuni(item.municipio);
                  }}
                  className={`flex items-center justify-between p-2.5 bg-white rounded-xl border transition-smooth cursor-pointer text-xs group ${
                    selectedMuni === item.municipio ? 'border-nayarit-gold bg-nayarit-gold/5 shadow-xs' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-nayarit-gold group-hover:scale-125 transition-smooth" />
                    <span className="font-bold text-slate-800 group-hover:text-nayarit-dark">{item.municipio}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-semibold">{item.count} solic.</span>
                    <span className="font-bold text-slate-900">{formatMoneda(item.inversion)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
