import React from 'react';
import { FileSpreadsheet, DollarSign, BarChart3, Users } from 'lucide-react';
import { formatMoneda } from '../../../../shared/utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function KpiCardsGrid({ resumen, onShowProductores }) {
  const navigate = useNavigate();

  const porcAprobado = resumen.inversionTotal > 0 
    ? Math.round((resumen.inversionAprobada / resumen.inversionTotal) * 100) 
    : 0;

  const handleTotalClick = () => {
    navigate('/consultar');
  };

  const handleSolicitadoClick = () => {
    // Redirigir a consulta filtrando por solicitudes activas / en trámite
    navigate('/consultar', { 
      state: { 
        filterStatuses: ['REGISTRADA', 'EN REVISIÓN', 'DICTAMINADA'],
        titleLabel: 'Solicitudes en Trámite (Inversión Solicitada)'
      } 
    });
  };

  const handleAutorizadoClick = () => {
    // Redirigir a consulta filtrando por solicitudes aprobadas / autorizadas
    navigate('/consultar', { 
      state: { 
        filterStatuses: ['APROBADA', 'PAGADA', 'FINALIZADA'],
        titleLabel: 'Solicitudes Autorizadas (Inversión Ejecutada)'
      } 
    });
  };

  const handleDemografiaClick = (type, val) => {
    if (type === 'genero') {
      navigate(`/consultar?genero=${val}`, { 
        state: { 
          filterGenero: val,
          titleLabel: `Solicitudes de Productores (${val === 'Hombre' ? 'Hombres' : 'Mujeres'})`
        } 
      });
    } else if (type === 'tipoPersona') {
      navigate(`/consultar?tipoPersona=${val}`, { 
        state: { 
          filterTipoPersona: val,
          titleLabel: 'Solicitudes de Organizaciones / Personas Morales'
        } 
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI 1: Total Solicitudes */}
      <div 
        onClick={handleTotalClick}
        className="glass-card rounded-2xl p-6 relative overflow-hidden transition-smooth hover:-translate-y-1 hover:border-nayarit-green/40 hover:shadow-xs cursor-pointer group"
      >
        <div className="absolute top-0 left-0 w-[4px] h-full bg-nayarit-green" />
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block group-hover:text-nayarit-green transition-smooth">
            Total Solicitudes
          </span>
          <div className="p-2.5 bg-nayarit-green/10 rounded-xl text-nayarit-green group-hover:bg-nayarit-green group-hover:text-white transition-smooth">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-bold text-slate-800 font-sans block">
            {resumen.totalSolicitudes}
          </span>
          <span className="text-slate-500 text-xs mt-1 block">
            Expedientes registrados
          </span>
        </div>
      </div>

      {/* KPI 2: Inversión Total */}
      <div 
        onClick={handleSolicitadoClick}
        className="glass-card rounded-2xl p-6 relative overflow-hidden transition-smooth hover:-translate-y-1 hover:border-nayarit-gold/40 hover:shadow-xs cursor-pointer group"
      >
        <div className="absolute top-0 left-0 w-[4px] h-full bg-nayarit-gold" />
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block group-hover:text-nayarit-gold transition-smooth">
            Inversión Solicitada
          </span>
          <div className="p-2.5 bg-nayarit-gold/10 rounded-xl text-nayarit-gold group-hover:bg-nayarit-gold group-hover:text-white transition-smooth">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-bold text-slate-800 font-sans block">
            {formatMoneda(resumen.inversionTotal)}
          </span>
          <span className="text-slate-500 text-xs mt-1 block">
            Monto total del presupuesto
          </span>
        </div>
      </div>

      {/* KPI 3: Inversión Aprobada */}
      <div 
        onClick={handleAutorizadoClick}
        className="glass-card rounded-2xl p-6 relative overflow-hidden transition-smooth hover:-translate-y-1 hover:border-nayarit-lightGreen/40 hover:shadow-xs cursor-pointer group"
      >
        <div className="absolute top-0 left-0 w-[4px] h-full bg-nayarit-lightGreen" />
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block group-hover:text-nayarit-lightGreen transition-smooth">
            Inversión Autorizada
          </span>
          <div className="p-2.5 bg-nayarit-lightGreen/10 rounded-xl text-nayarit-lightGreen group-hover:bg-nayarit-lightGreen group-hover:text-white transition-smooth">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-bold text-slate-800 font-sans block">
            {formatMoneda(resumen.inversionAprobada)}
          </span>
          <span className="text-nayarit-green text-xs font-semibold mt-1 flex items-center gap-1">
            <span>{porcAprobado}% aprobado</span>
            <span className="text-slate-400 font-normal">del total</span>
          </span>
        </div>
      </div>

      {/* KPI 4: Beneficiarios */}
      <div 
        onClick={onShowProductores}
        className="glass-card rounded-2xl p-6 relative overflow-hidden transition-smooth hover:-translate-y-1 hover:border-blue-400 hover:shadow-xs cursor-pointer group"
      >
        <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-500" />
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block group-hover:text-blue-500 transition-smooth">
            Productores Apoyados
          </span>
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-smooth">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-bold text-slate-800 font-sans block">
            {resumen.beneficiarios.total}
          </span>
          <div className="flex flex-wrap gap-2 mt-3.5 font-sans">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDemografiaClick('genero', 'Hombre');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/70 hover:bg-indigo-600 text-indigo-750 hover:text-white border border-indigo-100 rounded-full text-[10px] font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-3xs hover:shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              Hombres: {resumen.beneficiarios.hombres}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDemografiaClick('genero', 'Mujer');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50/70 hover:bg-rose-600 text-rose-750 hover:text-white border border-rose-100 rounded-full text-[10px] font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-3xs hover:shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              Mujeres: {resumen.beneficiarios.mujeres}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDemografiaClick('tipoPersona', 'MORAL');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50/70 hover:bg-purple-600 text-purple-750 hover:text-white border border-purple-100 rounded-full text-[10px] font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-3xs hover:shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              Org: {resumen.beneficiarios.organizaciones}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
