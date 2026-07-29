import React from 'react';
import { Filter, Search } from 'lucide-react';

export default function ConsultaFiltros({
  folio,
  setFolio,
  curp,
  setCurp,
  moduloTipo,
  setModuloTipo,
  municipio,
  setMunicipio,
  status,
  setStatus,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  catalogos,
  handleSearch,
  handleClearFilters
}) {
  return (
    <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-nayarit-gold" />
          <span>Filtros de Búsqueda</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Folio</label>
            <input
              type="text"
              value={folio}
              onChange={e => setFolio(e.target.value)}
              placeholder="SDR-NY-2026-..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-nayarit-gold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">CURP / RFC</label>
            <input
              type="text"
              value={curp}
              onChange={e => setCurp(e.target.value)}
              placeholder="CURP del Productor"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-nayarit-gold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Sector / Módulo</label>
            <select
              value={moduloTipo}
              onChange={e => setModuloTipo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-medium"
            >
              <option value="">Todos los sectores</option>
              <option value="AGRICULTURA_FRIJOL">Agricultura</option>
              <option value="GANADERIA">Ganadería</option>
              <option value="PESCA_ACUACULTURA">Pesca y Acuacultura</option>
              <option value="INFRAESTRUCTURA">Infraestructura Rural</option>
              <option value="MAQUINARIA">Centrales de Maquinaria</option>
              <option value="MEDIOS">Información de Medios</option>
              <option value="TEMAS_IMPORTANTES">Temas de Importancia</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Municipio</label>
            <select
              value={municipio}
              onChange={e => setMunicipio(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-medium"
            >
              <option value="">Todos los municipios</option>
              {catalogos.municipios?.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Estatus</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-medium"
            >
              <option value="">Todos los estatus</option>
              <option value="REGISTRADA,EN REVISIÓN,DICTAMINADA">⏳ En Trámite (Registrada, Revisión, Dictaminada)</option>
              <option value="APROBADA,PAGADA,FINALIZADA">✅ Autorizadas (Aprobada, Pagada, Finalizada)</option>
              <option disabled>──────────</option>
              <option value="REGISTRADA">REGISTRADA</option>
              <option value="EN REVISIÓN">EN REVISIÓN</option>
              <option value="DICTAMINADA">DICTAMINADA</option>
              <option value="APROBADA">APROBADA</option>
              <option value="PAGADA">PAGADA</option>
              <option value="FINALIZADA">FINALIZADA</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl hover:bg-slate-50 text-xs font-semibold transition-smooth cursor-pointer"
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-nayarit-green to-nayarit-dark hover:from-nayarit-lightGreen hover:to-nayarit-green text-white rounded-xl text-xs font-semibold transition-smooth shadow-sm cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Buscar Solicitudes
          </button>
        </div>
      </form>
    </div>
  );
}
