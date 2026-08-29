import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Building, Layers, Eye, Compass, Search } from 'lucide-react';
import { formatMoneda } from '../../../shared/utils/formatters';

// Componente auxiliar para ejecutar animación FlyTo suave al seleccionar un punto
function FlyToMarker({ targetCoord }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord && targetCoord.lat && targetCoord.lng) {
      map.flyTo([targetCoord.lat, targetCoord.lng], 14, {
        duration: 1.8,
        easeLinearity: 0.25
      });
    }
  }, [targetCoord, map]);
  return null;
}

export default function MapaDirectorioReal({
  puntos = [],
  puntoSeleccionado = null,
  onSelectPunto,
  capaActiva = 'ALL',
  setCapaActiva
}) {
  // Estado del tipo de mapa (Callejero u Ortofoto Satelital de Esri)
  const [tipoMapa, setTipoMapa] = useState('STREET'); // 'STREET' | 'SATELLITE'

  // Determinar color y estilo del marcador según la categoría del punto
  const getMarkerStyle = (punto) => {
    const isSelected = puntoSeleccionado?.id === punto.id;
    
    switch (punto.categoriaPunto) {
      case 'UPP':
        return {
          radius: isSelected ? 16 : 10,
          fillColor: '#059669', // Emerald
          color: '#ffffff',
          weight: isSelected ? 3 : 2,
          fillOpacity: 0.85
        };
      case 'PSG':
        return {
          radius: isSelected ? 16 : 10,
          fillColor: '#d97706', // Amber Gold
          color: '#ffffff',
          weight: isSelected ? 3 : 2,
          fillOpacity: 0.85
        };
      default: // PRODUCTOR
        return {
          radius: isSelected ? 16 : 9,
          fillColor: '#5E1232', // Nayarit Burgundy
          color: '#C29A52', // Nayarit Gold
          weight: isSelected ? 3.5 : 2,
          fillOpacity: 0.85
        };
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
      
      {/* ── CONTROLES FLOTANTES DEL MAPA ────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-xl text-xs text-white">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 font-bold uppercase tracking-wider text-[10px] text-amber-400">
          <Layers size={14} /> Capas y Visor
        </div>

        {/* CONMUTADOR DE MAPA CALLEJERO / SATELITAL */}
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1 border border-white/5">
          <button
            onClick={() => setTipoMapa('STREET')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[11px] transition-all ${
              tipoMapa === 'STREET' ? 'bg-nayarit-gold text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Callejero
          </button>
          <button
            onClick={() => setTipoMapa('SATELLITE')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[11px] transition-all ${
              tipoMapa === 'SATELLITE' ? 'bg-nayarit-gold text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satelital (Esri)
          </button>
        </div>

        {/* FILTRO POR CATEGORÍA DE PUNTO */}
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[10px] text-slate-400 font-semibold">Mostrar en mapa:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCapaActiva('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                capaActiva === 'ALL' ? 'bg-white text-slate-900 font-extrabold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({puntos.length})
            </button>
            <button
              onClick={() => setCapaActiva('PRODUCTOR')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                capaActiva === 'PRODUCTOR' ? 'bg-burgundy-600 text-white font-extrabold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Productores
            </button>
            <button
              onClick={() => setCapaActiva('UPP')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                capaActiva === 'UPP' ? 'bg-emerald-600 text-white font-extrabold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              UPPs Ganaderas
            </button>
            <button
              onClick={() => setCapaActiva('PSG')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                capaActiva === 'PSG' ? 'bg-amber-600 text-white font-extrabold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              PSG / Proveedores
            </button>
          </div>
        </div>
      </div>

      {/* ── MAPA INTERACTIVO LEAFLET ──────────────────────────────────────────── */}
      <MapContainer
        center={[21.5039, -104.8947]} // Centro en Tepic, Nayarit
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* ANIMACIÓN FLYTO AL SELECCIONAR PUNTO EN EL BUSCADOR */}
        {puntoSeleccionado && (
          <FlyToMarker targetCoord={puntoSeleccionado.coordenadas} />
        )}

        {/* TILE LAYER (CALLEJERO U ORTOFOTO SATELITAL DE ESRI) */}
        {tipoMapa === 'STREET' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* DIBUJO DE PUNTOS CARTOGRÁFICOS */}
        {puntos.map((p) => {
          const style = getMarkerStyle(p);
          const nombreProd = p.productor?.nombreCompleto || p.ganaderia?.nombrePredio || 'Productor';

          return (
            <CircleMarker
              key={p.id}
              center={[p.coordenadas.lat, p.coordenadas.lng]}
              radius={style.radius}
              fillColor={style.fillColor}
              color={style.color}
              weight={style.weight}
              fillOpacity={style.fillOpacity}
              eventHandlers={{
                click: () => onSelectPunto(p)
              }}
            >
              {/* TOOLTIP RÁPIDO AL PASAR EL MOUSE */}
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs p-1">
                  <div className="font-bold text-slate-900">{nombreProd}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{p.productor?.municipio || 'Nayarit'}</div>
                  {p.ganaderia?.upp && (
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">UPP: {p.ganaderia.upp}</div>
                  )}
                </div>
              </Tooltip>

              {/* POPUP CON RESUMEN Y BOTÓN PARA VER FICHA DETALLADA */}
              <Popup>
                <div className="p-2 max-w-xs space-y-2 text-xs">
                  <div className="font-extrabold text-slate-900 text-sm leading-snug">
                    {nombreProd}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    <span className="font-semibold">{p.productor?.localidad || 'Localidad'}, {p.productor?.municipio || 'Nayarit'}</span>
                  </div>

                  {p.productor?.telefono && (
                    <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold pt-1 border-t border-slate-100">
                      <Phone size={12} className="text-emerald-600" />
                      <span>{p.productor.telefono}</span>
                    </div>
                  )}

                  {p.apoyo && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-700">
                      <div><span className="text-slate-400">Concepto:</span> {p.apoyo.concepto}</div>
                      <div className="font-bold text-slate-900 pt-0.5">{formatMoneda(p.apoyo.montoTotal)}</div>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectPunto(p)}
                    className="w-full mt-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    Ver Ficha de Contacto →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
