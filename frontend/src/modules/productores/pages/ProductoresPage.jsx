import React, { useState, useEffect } from 'react';
import { apiGetProductores, apiGetSolicitud, apiActualizarEstatus, apiGetCatalogos, getCurrentUser } from '../../../shared/services/api';
import { Users, Search, UserCheck, Building, MapPin, Phone, FileText, ChevronRight, X, Calendar, ClipboardCheck, Sparkles, Folder } from 'lucide-react';
import ExpedienteDetalleModal from '../../solicitudes/components/ExpedienteDetalleModal';
import { toast } from '../../../shared/utils/toast';
import { formatModulo } from '../../../shared/utils/formatters';

export default function ProductoresPage() {
  const currentUser = getCurrentUser();
  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogos, setCatalogos] = useState({ municipios: [] });

  // Pestaña Activa ('FISICA' para individuales, 'MORAL' para organizaciones y colectivos)
  const [activeTab, setActiveTab] = useState('FISICA');

  // Filtros
  const [search, setSearch] = useState('');
  const [municipio, setMunicipio] = useState('');

  // Modales
  const [selectedProductor, setSelectedProductor] = useState(null); // Ficha del Productor
  
  // Modal de Detalle de Expediente (In-Place)
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
      console.error("Error al cargar catálogos en productores:", error);
    }
  };

  const fetchProductores = async () => {
    setLoading(true);
    try {
      const data = await apiGetProductores();
      setProductores(data || []);
    } catch (error) {
      console.error("Error al cargar censo de productores:", error);
      toast.error("Error al cargar el censo de productores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
    fetchProductores();

    // Notificar al navbar superior
    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        label: "PADRÓN DE BENEFICIARIOS",
        title: "CENSO DE PRODUCTORES Y ORGANIZACIONES",
        iconKey: "DASHBOARD",
        actions: [
          { id: "actualizar", text: "Actualizar" },
          ...(currentUser?.role !== 'ANALISTA' ? [{ id: "navigate-registrar", text: "Nueva Solicitud" }] : [])
        ]
      }
    }));
  }, []);

  // Escuchar actualizar desde el navbar
  useEffect(() => {
    const onActualizar = () => {
      fetchProductores();
    };
    window.addEventListener('sdr-navbar-action-actualizar', onActualizar);
    return () => {
      window.removeEventListener('sdr-navbar-action-actualizar', onActualizar);
    };
  }, []);

  const handleOpenExpediente = async (solId) => {
    setModalLoading(true);
    try {
      const detail = await apiGetSolicitud(solId);
      setSelectedSolicitud(detail);
      setNewEstatus(detail.status);
      setEstatusComentario('');
    } catch (error) {
      console.error("Error al abrir expediente desde productores:", error);
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
      await handleOpenExpediente(updated.id);
      fetchProductores(); // Refrescar lista
      toast.success("Estatus del expediente actualizado con éxito.");
    } catch (error) {
      console.error("Error al actualizar estatus desde productores:", error);
      toast.error("Error al actualizar estatus.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Filtrado de productores
  const filteredProductores = productores.filter(p => {
    const searchLower = search.toLowerCase();
    
    // Filtro de búsqueda por texto (nombre, CURP, RFC)
    let matchesSearch = false;
    if (p.tipoPersona === 'FISICA') {
      const fullName = `${p.nombre || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
      matchesSearch = fullName.includes(searchLower) || (p.curp && p.curp.toLowerCase().includes(searchLower));
    } else {
      const fullName = `${p.nombreOrganizacion || ''} ${p.representante || ''}`.toLowerCase();
      matchesSearch = fullName.includes(searchLower) || (p.rfc && p.rfc.toLowerCase().includes(searchLower));
    }

    // Filtro de Municipio
    const matchesMunicipio = municipio ? p.municipio === municipio : true;

    // Filtro de Pestaña Activa
    const matchesTab = activeTab === 'FISICA' 
      ? p.tipoPersona === 'FISICA'
      : (p.tipoPersona === 'MORAL' || p.tipoPersona === 'GRUPO');

    return matchesSearch && matchesMunicipio && matchesTab;
  });

  // Renderizar celda de expedientes para un productor
  const renderExpedientesCelda = (prod) => {
    const lista = prod.solicitudes || (prod.solicitud ? [prod.solicitud] : []);

    if (lista.length === 0) {
      return <span className="text-[10px] text-slate-400 font-bold italic">Sin solicitudes</span>;
    }

    if (lista.length === 1) {
      const sol = lista[0];
      return (
        <button
          onClick={() => handleOpenExpediente(sol.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-nayarit-gold/10 border border-slate-200 hover:border-nayarit-gold/30 rounded-xl text-xs font-bold text-slate-700 transition-smooth cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-nayarit-gold" />
          {sol.folio}
          <span className="px-1.5 py-0.25 bg-white border border-slate-200 rounded text-[8px] font-extrabold text-slate-500 uppercase">
            {sol.status}
          </span>
        </button>
      );
    }

    // Si tiene múltiples expedientes
    return (
      <button
        onClick={() => setSelectedProductor(prod)}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-extrabold transition-smooth cursor-pointer shadow-2xs"
        title="Haga clic para ver todos sus expedientes"
      >
        <Folder className="w-3.5 h-3.5 text-nayarit-gold" />
        <span>{lista.length} Expedientes</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. SECCIÓN DE FILTROS (MÁS COMPACTA) */}
      <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md shadow-3xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'FISICA' ? "Buscar productor por nombre o CURP..." : "Buscar organización, representante o RFC..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-nayarit-gold"
          />
        </div>

        <div className="flex w-full md:w-auto gap-3 items-center justify-end">
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-medium cursor-pointer"
          >
            <option value="">Todos los municipios</option>
            {catalogos.municipios?.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {(search || municipio) && (
            <button
              onClick={() => { setSearch(''); setMunicipio(''); }}
              className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 px-4 py-2 rounded-xl transition-smooth font-semibold cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* 2. PESTAÑAS (TABS) PREMIUM */}
      <div className="flex border-b border-slate-200 gap-6 shrink-0 pt-2">
        <button
          onClick={() => { setActiveTab('FISICA'); setSearch(''); }}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'FISICA'
              ? 'text-nayarit-gold font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className={`w-4 h-4 ${activeTab === 'FISICA' ? 'text-nayarit-gold' : 'text-slate-400'}`} />
            <span>Productores Individuales</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'FISICA' ? 'bg-nayarit-gold/15 text-nayarit-gold' : 'bg-slate-100 text-slate-500'
            }`}>
              {productores.filter(p => p.tipoPersona === 'FISICA').length}
            </span>
          </div>
          {activeTab === 'FISICA' && (
            <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-nayarit-gold rounded-full" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('MORAL'); setSearch(''); }}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'MORAL'
              ? 'text-nayarit-gold font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className={`w-4 h-4 ${activeTab === 'MORAL' ? 'text-nayarit-gold' : 'text-slate-400'}`} />
            <span>Organizaciones y Colectivos</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'MORAL' ? 'bg-nayarit-gold/15 text-nayarit-gold' : 'bg-slate-100 text-slate-500'
            }`}>
              {productores.filter(p => p.tipoPersona === 'MORAL' || p.tipoPersona === 'GRUPO').length}
            </span>
          </div>
          {activeTab === 'MORAL' && (
            <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-nayarit-gold rounded-full" />
          )}
        </button>
      </div>

      {/* 3. TABLA LISTADO DE PRODUCTORES */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200/80">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-3 border-nayarit-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProductores.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <ClipboardCheck className="w-12 h-12 text-slate-350 mx-auto" />
            <p className="text-slate-500 text-sm font-medium italic">
              No se encontraron {activeTab === 'FISICA' ? 'productores individuales' : 'organizaciones o colectivos'} con los filtros seleccionados.
            </p>
          </div>
        ) : activeTab === 'FISICA' ? (
          /* TABLA DE PERSONAS FÍSICAS */
          <div className="overflow-x-auto animate-fadeIn">
            <table className="w-full text-left text-sm text-slate-650 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Productor</th>
                  <th className="py-4 px-6">CURP</th>
                  <th className="py-4 px-6">Ubicación</th>
                  <th className="py-4 px-6">Contacto</th>
                  <th className="py-4 px-6">Demografía</th>
                  <th className="py-4 px-6 text-center">Expediente(s)</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductores.map(prod => (
                  <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-smooth">
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {prod.nombre} {prod.apellidoPaterno} {prod.apellidoMaterno || ''}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-slate-500 font-bold">{prod.curp}</span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="font-semibold text-slate-700">{prod.municipio}</div>
                      <div className="text-slate-400 font-medium">{prod.localidad}</div>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600">
                      {prod.telefono || 'Sin teléfono'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                          {prod.genero}
                        </span>
                        {prod.indigena === 'SI' && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">
                            Indígena ({prod.etnia || 'N/A'})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderExpedientesCelda(prod)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedProductor(prod)}
                        className="p-2 bg-slate-100 hover:bg-nayarit-gold/20 hover:text-nayarit-gold text-slate-500 rounded-lg transition-smooth cursor-pointer"
                        title="Ver perfil completo de expedientes"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* TABLA DE PERSONAS MORALES O GRUPOS */
          <div className="overflow-x-auto animate-fadeIn">
            <table className="w-full text-left text-sm text-slate-650 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Organización / Razón Social</th>
                  <th className="py-4 px-6">Representante Legal</th>
                  <th className="py-4 px-6">RFC</th>
                  <th className="py-4 px-6">Ubicación</th>
                  <th className="py-4 px-6">Contacto</th>
                  <th className="py-4 px-6 text-center">Expediente(s)</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductores.map(prod => (
                  <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-smooth">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{prod.nombreOrganizacion}</div>
                      <span className="px-1.5 py-0.25 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[8px] font-extrabold uppercase inline-block mt-0.5">
                        {prod.tipoPersona}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 text-xs">
                      {prod.representante}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-slate-500 font-bold">{prod.rfc}</span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="font-semibold text-slate-700">{prod.municipio}</div>
                      <div className="text-slate-400 font-medium">{prod.localidad}</div>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600">
                      {prod.telefono || 'Sin teléfono'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderExpedientesCelda(prod)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedProductor(prod)}
                        className="p-2 bg-slate-100 hover:bg-nayarit-gold/20 hover:text-nayarit-gold text-slate-500 rounded-lg transition-smooth cursor-pointer"
                        title="Ver perfil completo de expedientes"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL DE FICHA DEL PRODUCTOR (DETALLE COMPLETO E HISTORIAL DE SOLICITUDES) */}
      {selectedProductor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative border border-slate-200/80 overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Cabecera Modal */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-nayarit-gold/10 text-nayarit-gold flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block font-extrabold">Ficha Técnica Única</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5">Perfil de Beneficiario</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProductor(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-650 rounded-xl transition-smooth cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Ficha */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Bloque Nombre */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 leading-tight">
                    {selectedProductor.tipoPersona === 'FISICA'
                      ? `${selectedProductor.nombre} ${selectedProductor.apellidoPaterno} ${selectedProductor.apellidoMaterno || ''}`
                      : selectedProductor.nombreOrganizacion}
                  </h2>
                  <span className="text-xs text-slate-450 font-bold font-mono block mt-1">
                    {selectedProductor.tipoPersona === 'FISICA' 
                      ? `CURP: ${selectedProductor.curp}` 
                      : `RFC: ${selectedProductor.rfc}`}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedProductor.tipoPersona === 'FISICA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                }`}>
                  Persona {selectedProductor.tipoPersona === 'FISICA' ? 'Física' : 'Moral'}
                </span>
              </div>

              {/* Información Personal / Datos Generales */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">Datos Generales</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-700">
                  {selectedProductor.tipoPersona === 'FISICA' && (
                    <>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block">Género</span>
                        <span className="mt-0.5 block">{selectedProductor.genero}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block">Origen Indígena</span>
                        <span className="mt-0.5 block">{selectedProductor.indigena === 'SI' ? `Sí (${selectedProductor.etnia || 'Sin etnia'})` : 'No'}</span>
                      </div>
                    </>
                  )}
                  {selectedProductor.tipoPersona !== 'FISICA' && (
                    <>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block">Representante Legal</span>
                        <span className="mt-0.5 block">{selectedProductor.representante}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block">Tipo</span>
                        <span className="mt-0.5 block">Organización / Cooperativa</span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">Teléfono de Contacto</span>
                    <span className="mt-0.5 block">{selectedProductor.telefono || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">Fecha de Registro en Padrón</span>
                    <span className="mt-0.5 block">{new Date(selectedProductor.createdAt).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
              </div>

              {/* Ubicación y Domicilio */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">Ubicación y Domicilio</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">Municipio</span>
                    <span className="mt-0.5 block">{selectedProductor.municipio}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">Localidad</span>
                    <span className="mt-0.5 block">{selectedProductor.localidad}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-bold block">Domicilio Completo</span>
                    <span className="mt-0.5 block">{selectedProductor.domicilio}</span>
                  </div>
                </div>
              </div>

              {/* Expedientes e Historial de Solicitudes */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Expedientes e Historial de Solicitudes</h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {(selectedProductor.solicitudes || (selectedProductor.solicitud ? [selectedProductor.solicitud] : [])).length} Expediente(s)
                  </span>
                </div>
                
                {((selectedProductor.solicitudes || (selectedProductor.solicitud ? [selectedProductor.solicitud] : [])).length > 0) ? (
                  <div className="space-y-2">
                    {(selectedProductor.solicitudes || [selectedProductor.solicitud]).map(sol => (
                      <div key={sol.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-nayarit-gold/10 text-nayarit-gold mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{sol.folio}</span>
                              <span className="px-2 py-0.25 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase">
                                {sol.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              Sector: {formatModulo(sol.moduloTipo)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedProductor(null);
                            handleOpenExpediente(sol.id);
                          }}
                          className="py-1.5 px-3 bg-nayarit-green hover:bg-nayarit-dark text-white rounded-xl text-xs font-bold transition-smooth flex items-center justify-center gap-1 shadow-xs cursor-pointer shrink-0"
                        >
                          Ver Expediente
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay expedientes vinculados a este productor.</p>
                )}
              </div>
            </div>

            {/* Pie Modal */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedProductor(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-smooth cursor-pointer"
              >
                Cerrar Perfil
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL DE DETALLE COMPLETO DE EXPEDIENTE */}
      {selectedSolicitud && (
        <ExpedienteDetalleModal
          solicitud={selectedSolicitud}
          loading={modalLoading}
          onClose={() => setSelectedSolicitud(null)}
          currentUser={currentUser}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          onUpdateEstatus={handleUpdateEstatus}
        />
      )}

    </div>
  );
}
