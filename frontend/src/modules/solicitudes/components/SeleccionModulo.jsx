import React from 'react';
import { Sparkles } from 'lucide-react';
import { SECTORES } from '../../../shared/config/sectoresMetadata';

export default function SeleccionModulo({ handleSelectModulo }) {
  const upperRow = SECTORES.slice(0, 4);
  const lowerRow = SECTORES.slice(4, 7);

  const renderCard = (m) => {
    const Icon = m.Icon;
    return (
      <button
        key={m.id}
        onClick={() => handleSelectModulo(m.id)}
        className="bg-white border border-slate-200/80 rounded-3xl p-6 text-center flex flex-col items-center justify-center h-48 w-60 transition-all duration-300 shadow-sm hover:shadow-xl hover:bg-nayarit-lightGreen hover:border-nayarit-lightGreen hover:-translate-y-1 relative group cursor-pointer"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-14 h-14 bg-white/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-smooth" />
          <Icon className="w-12 h-12 text-nayarit-dark group-hover:text-white transition-smooth group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] relative z-10" />
        </div>

        <div className="mt-5 space-y-1.5">
          <h3 className="font-bold text-slate-800 text-[14.5px] leading-tight group-hover:text-white transition-smooth">
            {m.name}
          </h3>
          <p className="text-[10.5px] text-slate-400 font-medium leading-tight group-hover:text-white/80 transition-smooth">
            {m.desc}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="flex items-center justify-center gap-1.5 px-3 py-1 bg-nayarit-gold/10 text-nayarit-gold border border-nayarit-gold/25 rounded-full text-xs font-bold w-fit mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          Nueva Solicitud / Expediente
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">
          Selecciona el Sector de Registro
        </h1>
        <p className="text-slate-500 text-sm">
          Para iniciar la captura del expediente, elige el sector correspondiente
        </p>
      </div>

      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6">
          {upperRow.map(renderCard)}
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {lowerRow.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
