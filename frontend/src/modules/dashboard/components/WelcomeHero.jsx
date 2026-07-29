import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Users, TrendingUp } from 'lucide-react';
import { formatMoneda } from '../../../shared/utils/formatters';

export default function WelcomeHero({ currentUser, resumen }) {
  const navigate = useNavigate();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return '¡Buenos días';
    if (hr < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  return (
    <div className="bg-gradient-to-r from-[#5E1232] via-[#480c25] to-[#200210] text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-md border border-white/5 animate-fadeIn">
      {/* Círculos decorativos de luz en el fondo */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-nayarit-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 right-1/4 w-52 h-52 bg-nayarit-lightGreen/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Lado Izquierdo: Saludo y Atajos */}
        <div className="space-y-5 max-w-xl">


          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Administrador'} <span className="inline-block">👋</span>
            </h1>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              Hoy es <strong className="text-nayarit-lightGold font-bold">{getFormattedDate()}</strong>. 
              El sistema <strong className="text-white font-bold">SIRESA</strong> (Sistema de Registro de Solicitudes de Apoyo) tiene <strong className="text-white font-bold">{resumen.totalSolicitudes} expedientes</strong> registrados en trámite. ¿Qué te gustaría hacer hoy?
            </p>
          </div>

          {/* Atajos Rápidos */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {currentUser?.role !== 'ANALISTA' && (
              <button
                onClick={() => navigate('/registrar')}
                className="flex items-center gap-1.5 px-4 py-2 bg-nayarit-gold hover:bg-[#e3b868] text-[#200210] rounded-xl text-xs font-bold transition-smooth shadow-sm cursor-pointer hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Nueva Solicitud
              </button>
            )}
            <button
              onClick={() => navigate('/consultar')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-smooth cursor-pointer hover:scale-105 active:scale-95"
            >
              <Search className="w-3.5 h-3.5 text-nayarit-lightGold" />
              Buscar Expedientes
            </button>
            <button
              onClick={() => navigate('/productores')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-smooth cursor-pointer hover:scale-105 active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-nayarit-lightGold" />
              Ver Padrón
            </button>
          </div>
        </div>

        {/* Lado Derecho: Tarjeta de Estado Rápido */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shrink-0 w-full lg:w-72 flex flex-col justify-between gap-4 backdrop-blur-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider block">Avance Financiero</span>
            <TrendingUp className="w-4 h-4 text-nayarit-lightGreen" />
          </div>
          
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-medium block">Total Solicitado</span>
            <div className="text-lg font-black text-nayarit-lightGold">{formatMoneda(resumen.inversionTotal)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-400 font-medium">
              <span>Monto Autorizado</span>
              <span className="text-nayarit-lightGreen font-bold">
                {resumen.inversionAprobada && resumen.inversionTotal 
                  ? ((parseFloat(resumen.inversionAprobada) / parseFloat(resumen.inversionTotal)) * 100).toFixed(0) 
                  : 0}%
              </span>
            </div>
            {/* Barra de Progreso */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-1">
              <div 
                className="bg-gradient-to-r from-nayarit-gold to-nayarit-lightGreen h-full rounded-full" 
                style={{ 
                  width: `${resumen.inversionAprobada && resumen.inversionTotal 
                    ? Math.min(100, (parseFloat(resumen.inversionAprobada) / parseFloat(resumen.inversionTotal)) * 100) 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
