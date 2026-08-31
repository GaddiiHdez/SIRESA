import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, Printer, Download, RefreshCw, Layers, MapPin, 
  Users, TrendingUp, CheckCircle, PieChart, Landmark, HeartHandshake, 
  DollarSign, Sparkles, Building, ChevronRight, Award
} from 'lucide-react';
import { apiGetReporteEjecutivo, apiGetCatalogos, getCurrentUser } from '../../../shared/services/api';
import { formatMoneda } from '../../../shared/utils/formatters';
import { toast } from '../../../shared/utils/toast';

export default function ReportesEjecutivosPage() {
  const currentUser = getCurrentUser();

  const [reporte, setReporte] = useState(null);
  const [catalogos, setCatalogos] = useState({ municipios: [] });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [anio, setAnio] = useState('2026');
  const [sector, setSector] = useState('TODOS');
  const [municipio, setMunicipio] = useState('TODOS');

  const fetchCatalogos = async () => {
    try {
      const data = await apiGetCatalogos();
      setCatalogos(data || { municipios: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReporte = useCallback(async () => {
    setLoading(true);
    try {
      const params = { anio };
      if (sector !== 'TODOS') params.sector = sector;
      if (municipio !== 'TODOS') params.municipio = municipio;

      const data = await apiGetReporteEjecutivo(params);
      setReporte(data);
    } catch (err) {
      toast.error(err.message || 'Error al generar el reporte ejecutivo.');
    } finally {
      setLoading(false);
    }
  }, [anio, sector, municipio]);

  useEffect(() => {
    fetchCatalogos();
  }, []);

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  // Manejar Impresión / PDF Oficial
  const handlePrint = () => {
    window.print();
  };

  // Exportar Libro Completo a CSV UTF-8
  const handleExportCsv = () => {
    if (!reporte) {
      toast.error('No hay datos disponibles para exportar.');
      return;
    }

    const { resumenGlobal, sectores, coberturaMunicipios, inclusionSocial } = reporte;

    let csvContent = '\uFEFF';
    csvContent += 'GOBIERNO DEL ESTADO DE NAYARIT - SECRETARÍA DE DESARROLLO RURAL\n';
    csvContent += `INFORME EJECUTIVO DE INVERSIÓN Y DESARROLLO AGROPECUARIO - CICLO ${anio}\n`;
    csvContent += `Fecha de Emisión: ${new Date().toLocaleString('es-MX')}\n\n`;

    csvContent += '--- RESUMEN GLOBAL ---\n';
    csvContent += `Total de Solicitudes Registradas,${resumenGlobal.totalSolicitudes}\n`;
    csvContent += `Padrón Total de Productores Beneficiados,${resumenGlobal.totalProductores}\n`;
    csvContent += `Monto Total de Inversión Solicitada,$${resumenGlobal.inversionTotal}\n`;
    csvContent += `Aportación Gubernamental (Estatal),$${resumenGlobal.aportacionEstatal}\n`;
    csvContent += `Aportación Productores,$${resumenGlobal.aportacionProductores}\n`;
    csvContent += `Índice de Eficiencia de Dictamen,${resumenGlobal.eficienciaDictamen}%\n\n`;

    csvContent += '--- DESGLOSE POR SECTOR PRODUCTIVO ---\n';
    csvContent += 'Sector,Presupuesto Asignado,Inversión Solicitada,% Avance,Expedientes\n';
    sectores.forEach(s => {
      csvContent += `"${s.label}",$${s.asignado},$${s.invertido},${s.porcentaje}%,${s.expedientes}\n`;
    });
    csvContent += '\n';

    csvContent += '--- COBERTURA TERRITORIAL MUNICIPAL (TOP 20) ---\n';
    csvContent += 'Municipio,Productores Registrados,Inversión Total\n';
    coberturaMunicipios.forEach(m => {
      csvContent += `"${m.municipio}",${m.productores},$${m.inversion}\n`;
    });
    csvContent += '\n';

    csvContent += '--- INCLUSIÓN SOCIAL Y PERSPECTIVA DE GÉNERO ---\n';
    csvContent += `Mujeres Beneficiadas,${inclusionSocial.mujeres} (${inclusionSocial.porcentajeMujeres}%)\n`;
    csvContent += `Hombres Beneficiados,${inclusionSocial.hombres}\n`;
    csvContent += `Productores de Pueblos Originarios (Indígenas),${inclusionSocial.indigenas} (${inclusionSocial.porcentajeIndigenas}%)\n`;
    csvContent += `Productores con Discapacidad,${inclusionSocial.conDiscapacidad}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Informe_Ejecutivo_SEDER_Nayarit_${anio}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Libro de reporte ejecutivo exportado a CSV.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ── BARRA DE CONTROLES Y FILTROS (Se oculta al imprimir) ───────────────── */}
      <div className="print:hidden bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/10 to-amber-700/10 text-amber-900 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
              Módulo de Inteligencia de Datos
            </span>
            <span className="text-xs text-slate-400 font-medium">Nayarit 2026</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-nayarit-burgundy" />
            Reportes Ejecutivos para Informe de Gobierno
          </h2>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={anio}
            onChange={e => setAnio(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="2026">Ciclo Fiscal 2026</option>
            <option value="2025">Ciclo Fiscal 2025</option>
          </select>

          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="TODOS">Todos los Sectores</option>
            <option value="GANADERIA">Ganadería y Pecuario</option>
            <option value="AGRICULTURA_FRIJOL">Agricultura / Granos</option>
            <option value="PESCA_ACUACULTURA">Pesca y Acuacultura</option>
            <option value="INFRAESTRUCTURA">Infraestructura Rural</option>
            <option value="MAQUINARIA">Maquinaria y Equipo</option>
          </select>

          <select
            value={municipio}
            onChange={e => setMunicipio(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="TODOS">Cobertura Estatal (20 Mun.)</option>
            {catalogos.municipios?.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Botones de Acción */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Generar vista de impresión oficial o guardar como PDF"
          >
            <Printer size={14} className="text-amber-300" />
            <span>Imprimir / Guardar PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-nayarit-gold hover:bg-[#d8ae62] text-[#200210] rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
            title="Exportar base consolidada a Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* ── CÉDULA EJECUTIVA OFICIAL (Documento Oficial Imprimible) ─────────────── */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Consolidando datos de inversión y padrón estatal...
          </p>
        </div>
      ) : !reporte ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <p className="text-xs text-slate-500">No se pudieron generar los datos del reporte.</p>
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
          
          {/* ENCABEZADO OFICIAL DE GOBIERNO */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#5E1232] rounded-2xl flex items-center justify-center text-white font-black text-2xl border-2 border-nayarit-gold shadow-md print:shadow-none">
                <span className="text-amber-300">S</span>
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Gobierno del Estado de Nayarit
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Secretaría de Desarrollo Rural (SEDER)
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  Sistema de Registro de Solicitudes de Apoyo (SIRESA) — Cédula de Informe Ejecutivo
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                Ciclo Fiscal {reporte.ciclo}
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                Emisión: {new Date(reporte.fechaEmision).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* CUADRÍCULA DE KPIS DE ALTO IMPACTO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 print:bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Inversión Total Gestionada
              </span>
              <span className="text-2xl md:text-3xl font-black text-[#5E1232] mt-1 block truncate">
                {formatMoneda(reporte.resumenGlobal.inversionTotal)}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Estatal: <strong className="text-slate-800">{formatMoneda(reporte.resumenGlobal.aportacionEstatal)}</strong>
              </span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 print:bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Productores Beneficiados
              </span>
              <span className="text-2xl md:text-3xl font-black text-slate-900 mt-1 block">
                {reporte.resumenGlobal.totalProductores.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Padrón activo en {reporte.coberturaMunicipios.length} municipios
              </span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 print:bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Expedientes en Trámite
              </span>
              <span className="text-2xl md:text-3xl font-black text-slate-900 mt-1 block">
                {reporte.resumenGlobal.totalSolicitudes.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                {reporte.estatus.APROBADA + reporte.estatus.PAGADA} aprobadas/pagadas
              </span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 print:bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Eficiencia de Dictamen
              </span>
              <span className="text-2xl md:text-3xl font-black text-emerald-600 mt-1 block">
                {reporte.resumenGlobal.eficienciaDictamen}%
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Trámites resueltos favorablemente
              </span>
            </div>
          </div>

          {/* MATRIZ DE AVANCE PRESUPUESTAL POR SECTOR PRODUCTIVO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-nayarit-burgundy" />
                Avance Presupuestal y Cobertura por Sector Productivo
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Techos Financieros 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Sector Productivo</th>
                    <th className="p-3">Presupuesto Asignado</th>
                    <th className="p-3">Inversión Solicitada</th>
                    <th className="p-3">Expedientes</th>
                    <th className="p-3 w-44">Semáforo de Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporte.sectores.map(sec => {
                    const isHigh = sec.porcentaje >= 80;
                    const isMedium = sec.porcentaje >= 50 && sec.porcentaje < 80;
                    return (
                      <tr key={sec.key} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{sec.label}</td>
                        <td className="p-3 text-slate-700 font-medium">{formatMoneda(sec.asignado)}</td>
                        <td className="p-3 font-bold text-[#5E1232]">{formatMoneda(sec.invertido)}</td>
                        <td className="p-3 text-slate-700 font-semibold">{sec.expedientes} solicitudes</td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className={isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'}>
                                {sec.porcentaje}%
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {isHigh ? 'Alto' : isMedium ? 'Moderado' : 'Disponible'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, sec.porcentaje)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MATRIZ TERRITORIAL & INCLUSIÓN SOCIAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Municipios con Mayor Inversión */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-nayarit-burgundy" />
                  Distribución Territorial Municipal (Top 8)
                </h3>
              </div>

              <div className="space-y-2">
                {reporte.coberturaMunicipios.slice(0, 8).map((m, idx) => (
                  <div 
                    key={m.municipio} 
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900">{m.municipio}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-nayarit-burgundy block">{formatMoneda(m.inversion)}</span>
                      <span className="text-[10px] text-slate-500">{m.productores} productores</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusión Social y Perspectiva de Género */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-nayarit-burgundy" />
                  Inclusión Social y Perspectiva de Género
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                    Mujeres Productoras
                  </span>
                  <span className="text-2xl font-black text-purple-900 mt-1 block">
                    {reporte.inclusionSocial.mujeres}
                  </span>
                  <span className="text-[10px] text-purple-700 mt-0.5 block font-semibold">
                    {reporte.inclusionSocial.porcentajeMujeres}% del padrón total
                  </span>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Pueblos Originarios
                  </span>
                  <span className="text-2xl font-black text-amber-900 mt-1 block">
                    {reporte.inclusionSocial.indigenas}
                  </span>
                  <span className="text-[10px] text-amber-700 mt-0.5 block font-semibold">
                    Wixárika, Cora, Tepehuano
                  </span>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                    Hombres Productores
                  </span>
                  <span className="text-2xl font-black text-blue-900 mt-1 block">
                    {reporte.inclusionSocial.hombres}
                  </span>
                  <span className="text-[10px] text-blue-700 mt-0.5 block font-semibold">
                    Titulares de predios/UPPs
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Atención Inclusiva
                  </span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">
                    {reporte.inclusionSocial.conDiscapacidad}
                  </span>
                  <span className="text-[10px] text-emerald-700 mt-0.5 block font-semibold">
                    Productores con discapacidad
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PIE DE VALIDACIÓN INSTITUCIONAL Y FIRMAS */}
          <div className="pt-12 mt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <span className="font-bold text-slate-800 block">Titular de la Secretaría</span>
              <span className="text-[10px] text-slate-500 uppercase">Secretaría de Desarrollo Rural de Nayarit</span>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <span className="font-bold text-slate-800 block">Dirección General de Fomento</span>
              <span className="text-[10px] text-slate-500 uppercase">Validación Técnica SIRESA</span>
            </div>
          </div>

          {/* SELLO DIGITAL OFICIAL */}
          <div className="pt-4 text-center text-[9px] text-slate-400 font-mono">
            Sello Digital: SIRESA-NY-{reporte.ciclo}-{new Date().getTime().toString(36).toUpperCase()} • Documento emitido con validez técnica oficial conforme a las Reglas de Operación 2026.
          </div>
        </div>
      )}
    </div>
  );
}
