import React from 'react';
import { X, MapPin, Phone, MessageCircle, FileText, User, Building, Compass, ExternalLink, Calendar, Award } from 'lucide-react';
import { formatMoneda, formatModulo } from '../../../shared/utils/formatters';
import { getSectorIcon } from '../../../shared/config/sectoresMetadata';

/**
 * Ficha de Contacto y Detalle Geográfico
 * Drawer lateral retráctil para mostrar la información del punto seleccionado en el mapa.
 */
export default function FichaContactoDrawer({ punto, onClose, onVerExpediente }) {
  if (!punto) return null;

  const { productor, apoyo, ganaderia, coordenadas, categoriaPunto, esCoordenadaExacta } = punto;

  // Enlace directo a WhatsApp si tiene teléfono
  const cleanPhone = productor?.telefono?.replace(/[^0-9]/g, '') || '';
  const whatsappUrl = cleanPhone ? `https://wa.me/52${cleanPhone}` : null;

  // Icono por categoría
  const getBadgeStyle = () => {
    switch (categoriaPunto) {
      case 'UPP':
        return { label: 'Predio / UPP Ganadera', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
      case 'PSG':
        return { label: 'PSG / Punto de Servicio', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
      default:
        return { label: 'Productor Beneficiario', bg: 'bg-burgundy-500/10 text-nayarit-burgundy border-nayarit-burgundy/30' };
    }
  };

  const badge = getBadgeStyle();
  const SectorIcon = getSectorIcon(punto.moduloTipo);

  return (
    <div className="fixed inset-y-0 right-0 z-[2000] w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-fadeIn transition-all duration-300">
      
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-nayarit-burgundy via-[#480c25] to-slate-900 text-white p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="Cerrar ficha"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${badge.bg}`}>
            {badge.label}
          </span>
          {esCoordenadaExacta && (
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-400/30">
              GPS Exacto
            </span>
          )}
        </div>

        <h2 className="text-xl font-extrabold text-white leading-tight mb-1">
          {productor?.nombreCompleto || ganaderia?.nombrePredio || 'Sin Nombre Registrado'}
        </h2>

        <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0" />
          {productor?.localidad || ganaderia?.localidad || 'Localidad'}, {productor?.municipio || ganaderia?.municipio || 'Nayarit'}
        </p>
      </div>

      {/* ── CUERPO DE CONTENIDO ───────────────────────────────────────────────── */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">

        {/* DATOS DE CONTACTO Y UBICACIÓN */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={14} className="text-nayarit-gold" /> Datos de Contacto y Persona
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Tipo de Persona:</span>
              <span className="font-bold text-slate-800">{productor?.tipoPersona || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">CURP / RFC:</span>
              <span className="font-mono font-bold text-slate-800">{productor?.curp || productor?.rfc || 'No registrado'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium text-xs block mb-1">Domicilio Registrado:</span>
            <p className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {productor?.domicilio || 'Domicilio conocido'}
            </p>
          </div>

          {/* ACCIONES DE CONTACTO DIRECTO */}
          <div className="pt-2 flex gap-2">
            {productor?.telefono ? (
              <>
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Phone size={14} /> Llamar ({productor.telefono})
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl font-bold text-xs flex items-center justify-center transition-all border border-emerald-500/30"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">No hay teléfono registrado para este contacto.</p>
            )}
          </div>
        </div>

        {/* DETALLE TÉCNICO (PREDIO / UPP GANADERA IF APPLICABLE) */}
        {ganaderia && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building size={14} className="text-emerald-600" /> Registro Ganadero (UPP)
            </h3>

            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nombre Predio:</span>
                <span className="font-bold text-emerald-800">{ganaderia.nombrePredio}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Código UPP:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-slate-800">
                  {ganaderia.upp}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-emerald-100">
                <span className="text-slate-500 font-medium">Coordenadas GPS:</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* EXPEDIENTE Y APOYO SOLICITADO */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} className="text-nayarit-burgundy" /> Expediente Asociado
            </h3>
            <span className="font-mono text-xs font-bold text-nayarit-burgundy bg-burgundy-50 px-2 py-0.5 rounded-lg border border-burgundy-100">
              {punto.folio}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <SectorIcon size={16} className="text-nayarit-gold" />
              <span>{formatModulo(punto.moduloTipo)}</span>
            </div>

            {apoyo && (
              <>
                <p className="text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-normal block text-[10px]">Concepto Solicitado:</span>
                  {apoyo.concepto}
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Inversión Solicitada:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatMoneda(apoyo.montoTotal)}
                  </span>
                </div>
              </>
            )}

            {apoyo?.proveedor && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Proveedor / PSG:</span>
                <span className="font-bold text-slate-800">{apoyo.proveedor}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onVerExpediente(punto.id)}
            className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <ExternalLink size={14} /> Abrir Expediente Completo
          </button>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white border-t border-slate-200 text-center">
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          Secretaría de Desarrollo Rural — Nayarit 2026
        </span>
      </div>
    </div>
  );
}
