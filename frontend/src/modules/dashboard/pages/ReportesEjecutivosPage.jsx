import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, Printer, Download, RefreshCw, Layers, MapPin, 
  Users, TrendingUp, CheckCircle, PieChart, Landmark, HeartHandshake, 
  DollarSign, Sparkles, Building, ChevronRight, Award, ShieldCheck,
  Calendar, FileText, CheckCircle2
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
    csvContent += 'Sector,Presupuesto Asignado,Inversión Solicitada,Saldo Disponible,% Avance,Expedientes\n';
    sectores.forEach(s => {
      const saldo = Math.max(0, s.asignado - s.invertido);
      csvContent += `"${s.label}",$${s.asignado},$${s.invertido},$${saldo},${s.porcentaje}%,${s.expedientes}\n`;
    });
    csvContent += '\n';

    csvContent += '--- COBERTURA TERRITORIAL MUNICIPAL ---\n';
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

  // Cálculo de totales presupuestales consolidados
  const totalAsignado = reporte?.sectores?.reduce((acc, s) => acc + (s.asignado || 0), 0) || 0;
  const totalInvertido = reporte?.sectores?.reduce((acc, s) => acc + (s.invertido || 0), 0) || 0;
  const totalSaldo = Math.max(0, totalAsignado - totalInvertido);
  const totalPorcentaje = totalAsignado > 0 ? ((totalInvertido / totalAsignado) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-fadeIn pb-16 print:p-0 print:m-0 print:space-y-0">
      
      {/* ── BARRA DE CONTROLES Y FILTROS (Se oculta al imprimir) ───────────────── */}
      <div className="print:hidden bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/10 to-amber-700/10 text-amber-900 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
              Módulo de Inteligencia de Datos
            </span>
            <span className="text-xs text-slate-400 font-medium">Nayarit {anio}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-outfit">
            <Landmark className="w-5 h-5 text-[#5E1232]" />
            Cédula Oficial para Informes de Gobierno
          </h2>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={anio}
            onChange={e => setAnio(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors"
          >
            <option value="2026">Ciclo Fiscal 2026</option>
            <option value="2025">Ciclo Fiscal 2025</option>
          </select>

          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors"
          >
            <option value="TODOS">Cobertura Estatal (20 Municipios)</option>
            {catalogos.municipios?.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Botón Imprimir / PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#5E1232] hover:bg-[#4a0d27] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Generar vista de impresión oficial o guardar como PDF"
          >
            <Printer size={15} className="text-amber-300" />
            <span>Imprimir Cédula (PDF)</span>
          </button>

          {/* Botón Exportar CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-[#C29A52] hover:bg-[#b08842] text-[#200210] rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
            title="Exportar base consolidada a Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* ── CÉDULA EJECUTIVA OFICIAL (Documento Formal Multihistórico) ─────────────── */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#C29A52] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider font-sans">
            Consolidando datos de inversión y padrón agropecuario de Nayarit...
          </p>
        </div>
      ) : !reporte ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <p className="text-xs text-slate-500">No se pudieron generar los datos del reporte.</p>
        </div>
      ) : (
        <div className="bg-white p-8 md:p-14 rounded-3xl border border-slate-200 shadow-md space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-6">
          
          {/* ════ ENCABEZADO OFICIAL DE GOBIERNO CON LOGOTIPO INSTITUCIONAL ════ */}
          <div className="border-b-2 border-[#5E1232] pb-5 print-avoid-break">
            <div className="flex items-center justify-between gap-6">
              
              {/* Logo Oficial de Alta Resolución */}
              <div className="shrink-0">
                <img 
                  src="/logo-sdr-hd.png" 
                  onError={(e) => { e.target.src = '/logo-sdr.png'; }}
                  alt="Gobierno del Estado de Nayarit — Secretaría de Desarrollo Rural" 
                  className="h-16 md:h-20 w-auto object-contain"
                />
              </div>

              {/* Títulos Oficiales Institucionales */}
              <div className="text-right flex-1 min-w-0">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block font-sans">
                  GOBIERNO DEL ESTADO DE NAYARIT
                </span>
                <h1 className="text-lg md:text-xl font-black text-[#5E1232] tracking-tight leading-tight uppercase font-outfit">
                  SECRETARÍA DE DESARROLLO RURAL
                </h1>
                <p className="text-xs md:text-sm font-bold text-slate-800 tracking-normal mt-0.5">
                  Informe Ejecutivo de Inversión y Avance Agropecuario
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Ciclo Fiscal {reporte.ciclo}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Emisión: {new Date(reporte.fechaEmision).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Cintillo Informativo de Validez */}
            <div className="mt-4 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span><strong>Módulo:</strong> Sistema de Registro de Solicitudes de Apoyo (SIRESA)</span>
              <span><strong>Cobertura:</strong> {municipio === 'TODOS' ? 'Estatal (20 Municipios)' : municipio}</span>
              <span><strong>Sector:</strong> {sector === 'TODOS' ? 'Consolidado Multidisciplinario' : sector}</span>
            </div>
          </div>

          {/* ════ SECCIÓN 1: RESUMEN EJECUTIVO Y TOTALES ESTATALES ════ */}
          <div className="space-y-3 print-avoid-break report-section">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <div className="w-2.5 h-2.5 bg-[#5E1232] rounded-full" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-outfit">
                I. Resumen General e Indicadores Macro de Inversión
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Tarjeta 1: Inversión Total */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 card-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Inversión Total Gestionada
                </span>
                <span className="text-xl md:text-2xl font-black text-[#5E1232] mt-1 block">
                  {formatMoneda(reporte.resumenGlobal.inversionTotal)}
                </span>
                <span className="text-[10px] text-slate-600 font-medium mt-0.5 block">
                  Estatal: <strong className="text-slate-800">{formatMoneda(reporte.resumenGlobal.aportacionEstatal)}</strong>
                </span>
              </div>

              {/* Tarjeta 2: Productores */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 card-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Productores Beneficiados
                </span>
                <span className="text-xl md:text-2xl font-black text-slate-900 mt-1 block">
                  {reporte.resumenGlobal.totalProductores.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-600 font-medium mt-0.5 block">
                  Padrón activo en {reporte.coberturaMunicipios.length} municipios
                </span>
              </div>

              {/* Tarjeta 3: Expedientes */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 card-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Expedientes en Trámite
                </span>
                <span className="text-xl md:text-2xl font-black text-slate-900 mt-1 block">
                  {reporte.resumenGlobal.totalSolicitudes.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                  {reporte.estatus.APROBADA + reporte.estatus.PAGADA} aprobados / pagados
                </span>
              </div>

              {/* Tarjeta 4: Eficiencia */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 card-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Índice de Dictamen
                </span>
                <span className="text-xl md:text-2xl font-black text-emerald-700 mt-1 block">
                  {reporte.resumenGlobal.eficienciaDictamen}%
                </span>
                <span className="text-[10px] text-slate-600 font-medium mt-0.5 block">
                  Resolución favorable de apoyos
                </span>
              </div>
            </div>
          </div>

          {/* ════ SECCIÓN 2: MATRIZ DE DISTRIBUCIÓN PRESUPUESTAL POR SECTOR ════ */}
          <div className="space-y-3 print-avoid-break report-section">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#C29A52] rounded-full" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-outfit">
                  II. Techo Financiero y Distribución por Sector Productivo
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Pesos Mexicanos (MXN)</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#5E1232] text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 border-b border-r border-white/20">Sector Productivo</th>
                    <th className="p-3 border-b border-r border-white/20 text-right">Presupuesto Asignado</th>
                    <th className="p-3 border-b border-r border-white/20 text-right">Inversión Solicitada</th>
                    <th className="p-3 border-b border-r border-white/20 text-right">Saldo Disponible</th>
                    <th className="p-3 border-b border-r border-white/20 text-center">Expedientes</th>
                    <th className="p-3 border-b text-center w-36">% Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reporte.sectores.map(sec => {
                    const saldo = Math.max(0, sec.asignado - sec.invertido);
                    const isHigh = sec.porcentaje >= 80;
                    const isMedium = sec.porcentaje >= 50 && sec.porcentaje < 80;

                    return (
                      <tr key={sec.key} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900 border-r border-slate-200">
                          {sec.label}
                        </td>
                        <td className="p-3 text-slate-700 font-semibold text-right border-r border-slate-200">
                          {formatMoneda(sec.asignado)}
                        </td>
                        <td className="p-3 font-bold text-[#5E1232] text-right border-r border-slate-200">
                          {formatMoneda(sec.invertido)}
                        </td>
                        <td className="p-3 text-slate-600 font-medium text-right border-r border-slate-200">
                          {formatMoneda(saldo)}
                        </td>
                        <td className="p-3 text-slate-800 font-bold text-center border-r border-slate-200">
                          {sec.expedientes}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`font-black text-xs ${
                              isHigh ? 'text-rose-700' : isMedium ? 'text-amber-700' : 'text-emerald-700'
                            }`}>
                              {sec.porcentaje}%
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {isHigh ? '(Crítico)' : isMedium ? '(Moderado)' : '(Normal)'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Fila de Totales Oficiales */}
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="p-3 uppercase text-[10px] tracking-wider border-r border-slate-300">
                      Totales Consolidados
                    </td>
                    <td className="p-3 text-right border-r border-slate-300 font-extrabold">
                      {formatMoneda(totalAsignado)}
                    </td>
                    <td className="p-3 text-right text-[#5E1232] border-r border-slate-300 font-black">
                      {formatMoneda(totalInvertido)}
                    </td>
                    <td className="p-3 text-right border-r border-slate-300 font-extrabold">
                      {formatMoneda(totalSaldo)}
                    </td>
                    <td className="p-3 text-center border-r border-slate-300 font-black">
                      {reporte.resumenGlobal.totalSolicitudes}
                    </td>
                    <td className="p-3 text-center text-emerald-800 font-black">
                      {totalPorcentaje}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ════ SECCIÓN 3: DISTRIBUCIÓN TERRITORIAL Y COBERTURA MUNICIPAL ════ */}
          <div className="space-y-3 print-avoid-break report-section">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#5E1232] rounded-full" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-outfit">
                  III. Cobertura Territorial por Municipio
                </h2>
              </div>
              <span className="text-[10px] text-slate-500">{reporte.coberturaMunicipios.length} municipios registrados</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reporte.coberturaMunicipios.slice(0, 10).map((m, idx) => (
                <div 
                  key={m.municipio} 
                  className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs card-print"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{m.municipio}</span>
                      <span className="text-[10px] text-slate-500">{m.productores} productores registrados</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-[#5E1232] block">{formatMoneda(m.inversion)}</span>
                    <span className="text-[9px] text-slate-400">Inversión acumulada</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════ SECCIÓN 4: PERSPECTIVA DE GÉNERO E INCLUSIÓN SOCIAL ════ */}
          <div className="space-y-3 print-avoid-break report-section">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <div className="w-2.5 h-2.5 bg-[#C29A52] rounded-full" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-outfit">
                IV. Indicadores de Inclusión Social y Perspectiva de Género
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl card-print">
                <span className="text-[10px] font-bold text-purple-950 uppercase tracking-wider block">
                  Mujeres Productoras
                </span>
                <span className="text-xl font-black text-purple-900 mt-1 block">
                  {reporte.inclusionSocial.mujeres}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold block">
                  {reporte.inclusionSocial.porcentajeMujeres}% del padrón total
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl card-print">
                <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider block">
                  Pueblos Originarios
                </span>
                <span className="text-xl font-black text-amber-900 mt-1 block">
                  {reporte.inclusionSocial.indigenas}
                </span>
                <span className="text-[10px] text-amber-800 font-semibold block">
                  {reporte.inclusionSocial.porcentajeIndigenas}% (Wixárika / Cora)
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl card-print">
                <span className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                  Hombres Productores
                </span>
                <span className="text-xl font-black text-blue-900 mt-1 block">
                  {reporte.inclusionSocial.hombres}
                </span>
                <span className="text-[10px] text-blue-700 font-semibold block">
                  Titulares de predios / UPPs
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl card-print">
                <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider block">
                  Atención Incluyente
                </span>
                <span className="text-xl font-black text-emerald-900 mt-1 block">
                  {reporte.inclusionSocial.conDiscapacidad}
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  Productores con discapacidad
                </span>
              </div>
            </div>
          </div>

          {/* ════ SECCIÓN 5: CERTIFICACIÓN TÉCNICA Y FIRMAS INSTITUCIONALES ════ */}
          <div className="pt-8 border-t-2 border-slate-300 print-avoid-break space-y-8 report-section">
            <div className="text-center">
              <p className="text-[11px] text-slate-600 font-medium max-w-2xl mx-auto">
                El presente reporte y cédula técnica se emite con base en la información registrada y dictaminada en el Sistema de Registro de Solicitudes de Apoyo (SIRESA) en estricto apego a las Reglas de Operación vigentes del Estado de Nayarit.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-500 w-56 mx-auto mb-2" />
                <span className="font-bold text-slate-900 block text-xs">
                  Titular de la Secretaría
                </span>
                <span className="text-[10px] text-slate-500 uppercase block">
                  Secretaría de Desarrollo Rural del Estado de Nayarit
                </span>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-500 w-56 mx-auto mb-2" />
                <span className="font-bold text-slate-900 block text-xs">
                  Dirección General de Fomento
                </span>
                <span className="text-[10px] text-slate-500 uppercase block">
                  Validación Técnica y Normativa Agropecuaria
                </span>
              </div>
            </div>

            {/* Sello Digital Oficial de Autenticidad */}
            <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
              SELLO DIGITAL DE AUTENTICIDAD: SIRESA-NY-{reporte.ciclo}-{new Date().getTime().toString(36).toUpperCase()} • DOCUMENTO OFICIAL GENERADO ELECTRÓNICAMENTE CON VALIDEZ PLENA
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
