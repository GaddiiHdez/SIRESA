import React, { useState, useEffect } from 'react';
import { apiGetSolicitudes, apiGetSolicitud, apiActualizarEstatus, apiGetCatalogos, getCurrentUser } from '../../../shared/services/api';
import ConsultaFiltros from '../components/ConsultaFiltros';
import ConsultaTabla from '../components/ConsultaTabla';
import ExpedienteDetalleModal from '../components/ExpedienteDetalleModal';
import { useLocation } from 'react-router-dom';
import { toast } from '../../../shared/utils/toast';

export default function ConsultaExpedientesPage() {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de UI
  const [folio, setFolio] = useState('');
  const [curp, setCurp] = useState('');
  const [status, setStatus] = useState('');
  const [moduloTipo, setModuloTipo] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Filtros ocultos demográficos (desde Dashboard)
  const [generoFilter, setGeneroFilter] = useState('');
  const [tipoPersonaFilter, setTipoPersonaFilter] = useState('');
  const [activeTitle, setActiveTitle] = useState('EXPEDIENTES REGISTRADOS');

  const hasActiveFilters = Boolean(
    folio || curp || status || moduloTipo || municipio || fechaInicio || fechaFin || generoFilter || tipoPersonaFilter
  );

  // Catálogos para filtros
  const [catalogos, setCatalogos] = useState({ municipios: [], trimestres: [] });
  
  // Modal de Detalle
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newEstatus, setNewEstatus] = useState('');
  const [estatusComentario, setEstatusComentario] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchCatalogos = async () => {
    try {
      const cats = await apiGetCatalogos();
      setCatalogos(cats);
    } catch (error) {
      console.error("Error al cargar catálogos en listado:", error);
    }
  };

  const fetchSolicitudes = async (overrideFilters = null) => {
    setLoading(true);
    try {
      const filters = {};
      
      if (overrideFilters) {
        Object.assign(filters, overrideFilters);
      } else {
        if (folio) filters.folio = folio;
        if (curp) filters.curp = curp;
        if (status) filters.status = status;
        if (moduloTipo) filters.moduloTipo = moduloTipo;
        if (municipio) filters.municipio = municipio;
        if (fechaInicio) filters.fechaInicio = fechaInicio;
        if (fechaFin) filters.fechaFin = fechaFin;
        if (generoFilter) filters.genero = generoFilter;
        if (tipoPersonaFilter) filters.tipoPersona = tipoPersonaFilter;
      }

      const data = await apiGetSolicitudes(filters);
      setSolicitudes(data);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();

    const queryParams = new URLSearchParams(location.search);
    const filterModulo = queryParams.get('moduloTipo') || location.state?.filterModulo;
    const filterMunicipio = queryParams.get('municipio') || location.state?.filterMunicipio;
    const filterStatuses = location.state?.filterStatuses;
    const filterGenero = queryParams.get('genero') || location.state?.filterGenero;
    const filterTipoPersona = queryParams.get('tipoPersona') || location.state?.filterTipoPersona;
    const openId = queryParams.get('openId');
    const titleLabel = location.state?.titleLabel;

    // Comprobar si venimos de una redirección explícita del Dashboard con filtros
    const hasDashboardFilters = filterModulo || filterMunicipio || filterStatuses || filterGenero || filterTipoPersona || titleLabel;

    let initFilters = {};

    if (hasDashboardFilters) {
      // Aplicar filtros del dashboard y guardarlos en sessionStorage
      if (filterModulo) {
        setModuloTipo(filterModulo);
        initFilters.moduloTipo = filterModulo;
      }
      if (filterMunicipio) {
        setMunicipio(filterMunicipio);
        initFilters.municipio = filterMunicipio;
      }
      if (filterStatuses) {
        const statusesStr = filterStatuses.join(',');
        setStatus(statusesStr);
        initFilters.status = statusesStr;
      }
      if (filterGenero) {
        setGeneroFilter(filterGenero);
        initFilters.genero = filterGenero;
      }
      if (filterTipoPersona) {
        setTipoPersonaFilter(filterTipoPersona);
        initFilters.tipoPersona = filterTipoPersona;
      }
      
      const newTitle = titleLabel || (filterMunicipio ? `Expedientes en el Municipio de ${filterMunicipio}` : "EXPEDIENTES REGISTRADOS");
      setActiveTitle(newTitle);

      sessionStorage.setItem('sdr-expedientes-filters', JSON.stringify({
        folio: '',
        curp: '',
        status: initFilters.status || '',
        moduloTipo: initFilters.moduloTipo || '',
        municipio: initFilters.municipio || '',
        fechaInicio: '',
        fechaFin: '',
        generoFilter: initFilters.genero || '',
        tipoPersonaFilter: initFilters.tipoPersona || '',
        activeTitle: newTitle
      }));
    } else {
      // Si no viene del Dashboard, restaurar desde sessionStorage si existe
      const savedFiltersStr = sessionStorage.getItem('sdr-expedientes-filters');
      if (savedFiltersStr) {
        try {
          const saved = JSON.parse(savedFiltersStr);
          setFolio(saved.folio || '');
          setCurp(saved.curp || '');
          setStatus(saved.status || '');
          setModuloTipo(saved.moduloTipo || '');
          setMunicipio(saved.municipio || '');
          setFechaInicio(saved.fechaInicio || '');
          setFechaFin(saved.fechaFin || '');
          setGeneroFilter(saved.generoFilter || '');
          setTipoPersonaFilter(saved.tipoPersonaFilter || '');
          setActiveTitle(saved.activeTitle || 'EXPEDIENTES REGISTRADOS');

          initFilters = {
            folio: saved.folio || '',
            curp: saved.curp || '',
            status: saved.status || '',
            moduloTipo: saved.moduloTipo || '',
            municipio: saved.municipio || '',
            fechaInicio: saved.fechaInicio || '',
            fechaFin: saved.fechaFin || '',
            genero: saved.generoFilter || '',
            tipoPersona: saved.tipoPersonaFilter || ''
          };
        } catch (e) {
          console.error("Error al cargar filtros de sessionStorage:", e);
        }
      } else {
        setActiveTitle('EXPEDIENTES REGISTRADOS');
      }
    }

    const loadData = async () => {
      await fetchSolicitudes(Object.keys(initFilters).length > 0 ? initFilters : null);
      if (openId) {
        handleOpenDetail(openId);
      }
    };
    loadData();

    const handleGlobalUpdate = () => {
      fetchSolicitudes();
    };

    window.addEventListener('sdr-solicitud-updated', handleGlobalUpdate);

    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        label: "BÚSQUEDA Y SEGUIMIENTO",
        title: titleLabel || activeTitle || "EXPEDIENTES REGISTRADOS",
        iconKey: "CONSULTA",
        actions: currentUser?.role !== 'ANALISTA' ? [
          { id: "navigate-registrar", text: "Nueva Solicitud" }
        ] : []
      }
    }));

    return () => {
      window.removeEventListener('sdr-solicitud-updated', handleGlobalUpdate);
    };
  }, [location.search, location.state]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Al buscar manualmente desde el formulario, limpiamos los filtros ocultos del Dashboard
    setGeneroFilter('');
    setTipoPersonaFilter('');
    setActiveTitle('EXPEDIENTES REGISTRADOS');

    const searchFilters = {
      folio,
      curp,
      status,
      moduloTipo,
      municipio,
      fechaInicio,
      fechaFin,
      genero: '',
      tipoPersona: ''
    };

    // Guardar filtros manuales en sessionStorage
    sessionStorage.setItem('sdr-expedientes-filters', JSON.stringify({
      folio,
      curp,
      status,
      moduloTipo,
      municipio,
      fechaInicio,
      fechaFin,
      generoFilter: '',
      tipoPersonaFilter: '',
      activeTitle: 'EXPEDIENTES REGISTRADOS'
    }));

    fetchSolicitudes(searchFilters);
  };

  const handleClearFilters = () => {
    setFolio('');
    setCurp('');
    setStatus('');
    setModuloTipo('');
    setMunicipio('');
    setFechaInicio('');
    setFechaFin('');
    setGeneroFilter('');
    setTipoPersonaFilter('');
    setActiveTitle('EXPEDIENTES REGISTRADOS');
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('sdr-expedientes-filters');

    fetchSolicitudes({ 
      folio: '', 
      curp: '', 
      status: '', 
      moduloTipo: '', 
      municipio: '',
      fechaInicio: '',
      fechaFin: '',
      genero: '',
      tipoPersona: ''
    });
  };

  const handleOpenDetail = async (solId) => {
    setModalLoading(true);
    try {
      const detail = await apiGetSolicitud(solId);
      setSelectedSolicitud(detail);
      setNewEstatus(detail.status);
      setEstatusComentario('');
    } catch (error) {
      console.error("Error al cargar detalle de solicitud:", error);
      toast.error("Error al cargar el expediente.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateEstatus = async (e) => {
    e.preventDefault();
    if (!newEstatus) return;

    setUpdateLoading(true);
    try {
      const updated = await apiActualizarEstatus(selectedSolicitud.id, newEstatus, estatusComentario);
      await handleOpenDetail(updated.id);
      fetchSolicitudes();
      toast.success("Estatus del expediente actualizado con éxito.");
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      toast.error("Error al actualizar estatus.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!solicitudes || solicitudes.length === 0) {
      toast.error("No hay expedientes para exportar.");
      return;
    }

    const headers = [
      "Folio",
      "Fecha Registro",
      "Sector/Modulo",
      "Productor / Razon Social",
      "CURP / RFC",
      "Municipio",
      "Localidad",
      "Monto Solicitado",
      "Estatus"
    ];

    const rows = solicitudes.map(sol => [
      `"${sol.folio || ''}"`,
      `"${sol.createdAt ? new Date(sol.createdAt).toLocaleDateString('es-MX') : ''}"`,
      `"${sol.moduloTipo || ''}"`,
      `"${(sol.productor?.nombreCompleto || sol.productor?.razonSocial || '').replace(/"/g, '""')}"`,
      `"${sol.productor?.curp || sol.productor?.rfc || ''}"`,
      `"${sol.productor?.municipio || ''}"`,
      `"${sol.productor?.localidad || ''}"`,
      sol.apoyoControl?.montoTotal || 0,
      `"${sol.status || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `Expedientes_SIRESA_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exportados ${solicitudes.length} expedientes a Excel (${filename})`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <ConsultaFiltros
        folio={folio}
        setFolio={setFolio}
        curp={curp}
        setCurp={setCurp}
        moduloTipo={moduloTipo}
        setModuloTipo={setModuloTipo}
        municipio={municipio}
        setMunicipio={setMunicipio}
        status={status}
        setStatus={setStatus}
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        catalogos={catalogos}
        handleSearch={handleSearch}
        handleClearFilters={handleClearFilters}
      />

      {/* Banner de Filtros Activos desde Dashboard */}
      {hasActiveFilters && activeTitle !== 'EXPEDIENTES REGISTRADOS' && (
        <div className="bg-nayarit-gold/10 border border-nayarit-gold/20 rounded-2xl px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between text-xs text-nayarit-dark font-medium shadow-3xs gap-3">
          <div className="flex items-start md:items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-nayarit-gold rounded-full animate-pulse mt-0.5 md:mt-0 shrink-0" />
            <div>
              <span>Filtro activo desde el Dashboard: <strong className="font-bold">{activeTitle}</strong></span>
              {status === 'REGISTRADA,EN REVISIÓN,DICTAMINADA' && (
                <p className="text-[11px] text-slate-600 font-normal mt-1 leading-relaxed">
                  💡 <strong>¿Por qué ves diferentes estatus?</strong> La <em>Inversión Solicitada</em> representa el presupuesto total en trámite. Incluye todas las solicitudes activas en evaluación (estatus <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 font-bold">REGISTRADA</span>, <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-bold">EN REVISIÓN</span> y <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-700 font-bold">DICTAMINADA</span>) antes de que sus fondos sean aprobados.
                </p>
              )}
              {status === 'APROBADA,PAGADA,FINALIZADA' && (
                <p className="text-[11px] text-slate-600 font-normal mt-1 leading-relaxed">
                  💡 <strong>Inversión Autorizada / Ejercida:</strong> Muestra únicamente las solicitudes cuyos recursos ya fueron aprobados, pagados o entregados (estatus <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 font-bold">APROBADA</span>, <span className="bg-teal-100 px-1.5 py-0.5 rounded text-teal-700 font-bold">PAGADA</span> y <span className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-700 font-bold">FINALIZADA</span>).
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={handleClearFilters}
            className="text-[11px] bg-white border border-slate-200 hover:border-red-400 hover:text-red-500 px-3.5 py-1.5 rounded-xl transition-smooth font-bold cursor-pointer shrink-0 self-start md:self-auto shadow-3xs"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <ConsultaTabla
        solicitudes={solicitudes}
        loading={loading}
        handleOpenDetail={handleOpenDetail}
        onExportExcel={handleExportExcel}
      />

      {selectedSolicitud && (
        <ExpedienteDetalleModal
          selectedSolicitud={selectedSolicitud}
          setSelectedSolicitud={setSelectedSolicitud}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          handleUpdateEstatus={handleUpdateEstatus}
        />
      )}
    </div>
  );
}
