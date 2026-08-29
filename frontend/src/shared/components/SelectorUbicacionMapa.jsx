import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Navigation, Layers, CheckCircle2, AlertTriangle, Crosshair } from 'lucide-react';
import { toast } from '../utils/toast';

// Coordenadas centrales de referencia de los 20 municipios de Nayarit
const CENTROS_MUNICIPIOS = {
  'Tepic': [21.5039, -104.8947],
  'Santiago Ixcuintla': [21.8108, -105.2081],
  'Compostela': [21.2361, -104.9008],
  'Bahía de Banderas': [20.8000, -105.2500],
  'Acaponeta': [22.4964, -105.3597],
  'Tecuala': [22.3983, -105.4583],
  'Rosamorada': [22.1222, -105.2056],
  'Tuxpan': [21.9422, -105.2958],
  'San Blas': [21.5408, -105.2853],
  'Xalisco': [21.4458, -104.8986],
  'Ruíz': [21.9500, -105.1431],
  'Huajicori': [22.6347, -105.3189],
  'Del Nayar': [22.2472, -104.5822],
  'La Yesca': [21.3189, -104.0139],
  'Santa María del Oro': [21.3339, -104.5861],
  'San Pedro Lagunillas': [21.2189, -104.7522],
  'Jala': [21.1689, -104.4339],
  'Ahuacatlán': [21.0539, -104.4836],
  'Ixtlán del Río': [21.0369, -104.3717],
  'Amatlán de Cañas': [20.8061, -104.4039]
};

// Bounding Box de Nayarit
const NAYARIT_BOUNDS = {
  minLat: 20.60,
  maxLat: 23.10,
  minLng: -105.75,
  maxLng: -103.70
};

// Icono personalizado para el Pin en el mapa
const customPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
      <div style="background: #5E1232; border: 2.5px solid #C29A52; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C29A52" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="width: 4px; height: 8px; background: #C29A52; margin-top: -2px; border-radius: 2px;"></div>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42]
});

// Helper para convertir coordenadas de DMS a Decimal
function parseCoordinate(input, isLongitude = false) {
  if (typeof input === 'number') {
    if (isNaN(input)) return null;
    return isLongitude ? (input > 0 ? -input : input) : input;
  }
  if (!input || typeof input !== 'string') return null;

  const str = input.trim();
  if (!str) return null;

  // Si es decimal directo
  const directNum = parseFloat(str.replace(/[^0-9.-]/g, ''));
  if (!isNaN(directNum) && !str.includes('°') && !str.includes("'") && !str.includes('"')) {
    return isLongitude ? (directNum > 0 ? -directNum : directNum) : directNum;
  }

  // Regex para DMS: ej. 21°30'15.4" N o 104°53'45" W
  const dmsRegex = /(\d+)[°\s]+(\d+)?['\s]*([\d.]+)?["\s]*([NSEWO])?/i;
  const match = str.match(dmsRegex);

  if (match) {
    const deg = parseFloat(match[1]) || 0;
    const min = parseFloat(match[2]) || 0;
    const sec = parseFloat(match[3]) || 0;
    const dir = (match[4] || '').toUpperCase();

    let dec = deg + (min / 60) + (sec / 3600);
    if (dir === 'S' || dir === 'W' || dir === 'O' || isLongitude) {
      dec = -Math.abs(dec);
    }
    return dec;
  }

  return isNaN(directNum) ? null : (isLongitude ? (directNum > 0 ? -directNum : directNum) : directNum);
}

// Escuchar clics en el mapa
function MapClickHandler({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Animar mapa al centro del municipio o coordenadas
function MapRecenter({ targetCoord }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord && targetCoord[0] && targetCoord[1]) {
      map.flyTo(targetCoord, 14, { duration: 1.2 });
    }
  }, [targetCoord, map]);
  return null;
}

export default function SelectorUbicacionMapa({
  latitud,
  longitud,
  municipio,
  onCoordsChange,
  required = false,
  label = "Ubicación Geográfica y Coordenadas del Predio"
}) {
  const [mapType, setMapType] = useState('SATELLITE'); // 'SATELLITE' | 'STREET'
  const [showMap, setShowMap] = useState(true);
  const [gettingGps, setGettingGps] = useState(false);

  // Valores numéricos parseados
  const numLat = parseCoordinate(latitud, false);
  const numLng = parseCoordinate(longitud, true);

  const hasValidCoords = numLat !== null && numLng !== null && !isNaN(numLat) && !isNaN(numLng);

  // Validación de Bounding Box de Nayarit
  const isInsideNayarit = hasValidCoords &&
    numLat >= NAYARIT_BOUNDS.minLat &&
    numLat <= NAYARIT_BOUNDS.maxLat &&
    numLng >= NAYARIT_BOUNDS.minLng &&
    numLng <= NAYARIT_BOUNDS.maxLng;

  // Centro para el mapa
  const defaultCenter = (municipio && CENTROS_MUNICIPIOS[municipio]) 
    ? CENTROS_MUNICIPIOS[municipio] 
    : [21.5039, -104.8947];

  const currentCenter = hasValidCoords ? [numLat, numLng] : defaultCenter;

  const handlePointSelect = (lat, lng) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));
    onCoordsChange(cleanLat.toString(), cleanLng.toString());
  };

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador o dispositivo no soporta geolocalización GPS.');
      return;
    }

    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGettingGps(false);
        const { latitude, longitude, accuracy } = pos.coords;
        handlePointSelect(latitude, longitude);
        toast.success(`📍 Ubicación GPS capturada (Precisión: ±${Math.round(accuracy)} m)`);
      },
      (err) => {
        setGettingGps(false);
        console.error("Error al obtener GPS:", err);
        toast.error('No se pudo obtener el GPS. Verifica los permisos de ubicación en tu navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      
      {/* HEADER CON TÍTULO Y BOTÓN GPS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
        <div>
          <label className="text-slate-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={16} className="text-nayarit-gold" />
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Haz clic en el mapa satelital sobre el predio o ingresa las coordenadas numéricas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÓN CAPTURAR GPS DISPOSITIVO */}
          <button
            type="button"
            onClick={handleGetGps}
            disabled={gettingGps}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Obtener coordenadas GPS del sensor de este dispositivo"
          >
            <Crosshair size={14} className={gettingGps ? "animate-spin" : ""} />
            <span>{gettingGps ? "Detectando GPS..." : "Capturar GPS Actual"}</span>
          </button>

          {/* TOGGLE MOSTRAR/OCULTAR MAPA */}
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {showMap ? "Ocultar Mapa" : "Ver Mapa"}
          </button>
        </div>
      </div>

      {/* INPUTS DE LATITUD Y LONGITUD CON VALIDACIÓN EN VIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-700">Latitud Norte</span>
            {hasValidCoords && (
              <span className={`text-[10px] font-extrabold px-2 py-0.25 rounded-md ${
                isInsideNayarit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {numLat.toFixed(4)}° N
              </span>
            )}
          </div>
          <input
            type="text"
            value={latitud || ''}
            onChange={(e) => onCoordsChange(e.target.value, longitud || '')}
            placeholder="Ej. 21.5039 o 21°30'15'' N"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:border-[#5E1232] focus:ring-2 focus:ring-[#5E1232]/10 outline-none transition-all"
            required={required}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-700">Longitud Oeste</span>
            {hasValidCoords && (
              <span className={`text-[10px] font-extrabold px-2 py-0.25 rounded-md ${
                isInsideNayarit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {numLng.toFixed(4)}° W
              </span>
            )}
          </div>
          <input
            type="text"
            value={longitud || ''}
            onChange={(e) => onCoordsChange(latitud || '', e.target.value)}
            placeholder="Ej. -104.8947 o 104°53'45'' W"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:border-[#5E1232] focus:ring-2 focus:ring-[#5E1232]/10 outline-none transition-all"
            required={required}
          />
        </div>
      </div>

      {/* BADGES DE VALIDACIÓN GEOGRÁFICA */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        <div className="flex items-center gap-2">
          {hasValidCoords ? (
            isInsideNayarit ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 size={14} /> Coordenadas válidas en el territorio de Nayarit
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertTriangle size={14} /> Coordenada fuera del rango promedio de Nayarit
              </span>
            )
          ) : (
            <span className="text-slate-400 font-medium text-[11px]">
              Tip: Puedes hacer clic directamente en la foto satelital para ubicar el rancho.
            </span>
          )}
        </div>

        {hasValidCoords && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${numLat},${numLng}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#5E1232] hover:underline font-bold text-[11px] flex items-center gap-1"
          >
            <Navigation size={12} /> Ver en Google Maps
          </a>
        )}
      </div>

      {/* VISOR MAPA LEAFLET INTERACTIVO (PICKER) */}
      {showMap && (
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-300 shadow-inner mt-2">
          
          {/* CONMUTADOR CALLEJERO / SATELITAL */}
          <div className="absolute top-3 right-3 z-[400] flex bg-slate-900/85 backdrop-blur-md rounded-xl p-1 gap-1 border border-white/10 shadow-lg text-[10px] font-bold text-white">
            <button
              type="button"
              onClick={() => setMapType('SATELLITE')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapType === 'SATELLITE' ? 'bg-nayarit-gold text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              Satélite (Esri)
            </button>
            <button
              type="button"
              onClick={() => setMapType('STREET')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapType === 'STREET' ? 'bg-nayarit-gold text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              Callejero
            </button>
          </div>

          <MapContainer
            center={currentCenter}
            zoom={hasValidCoords ? 14 : (municipio ? 12 : 9)}
            scrollWheelZoom={true}
            className="w-full h-full z-0 cursor-crosshair"
          >
            <MapClickHandler onLocationSelected={handlePointSelect} />
            <MapRecenter targetCoord={currentCenter} />

            {mapType === 'SATELLITE' ? (
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {/* MARCADOR DEL PUNTO SELECCIONADO */}
            {hasValidCoords && (
              <Marker
                position={[numLat, numLng]}
                icon={customPinIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    handlePointSelect(position.lat, position.lng);
                  }
                }}
              />
            )}
          </MapContainer>

          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-white font-semibold z-[400]">
            📍 Haz clic o arrastra el marcador para fijar la ubicación del predio
          </div>
        </div>
      )}
    </div>
  );
}
