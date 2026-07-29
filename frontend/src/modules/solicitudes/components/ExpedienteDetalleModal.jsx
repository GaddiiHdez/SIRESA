import React from 'react';
import { X, Calendar, ClipboardCheck, Layers, User as UserIcon, Wallet, FileText, Upload, Lock } from 'lucide-react';
import { formatMoneda, formatFecha, formatModulo } from '../../../shared/utils/formatters';
import PasoEspecifico from './PasoEspecifico';
import { apiSubirDocumento, apiActualizarDocumentos, getCurrentUser } from '../../../shared/services/api';
import { toast } from '../../../shared/utils/toast';

export default function ExpedienteDetalleModal({
  selectedSolicitud,
  setSelectedSolicitud,
  newEstatus,
  setNewEstatus,
  estatusComentario,
  setEstatusComentario,
  updateLoading,
  handleUpdateEstatus
}) {
  const currentUser = getCurrentUser();
  const isAnalista = currentUser?.role === 'ANALISTA';
  const [activeKey, setActiveKey] = React.useState(null);
  const [docProgress, setDocProgress] = React.useState({});
  const [uploadingKey, setUploadingKey] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const docsList = [
    { key: 'ine', label: 'Identificación Oficial Vigente', dbKey: 'ineUrl' },
    { key: 'curp', label: 'CURP del Solicitante', dbKey: 'curpUrl' },
    { key: 'rfc', label: 'Cédula Fiscal (RFC)', dbKey: 'rfcUrl' },
    { key: 'comprobante', label: 'Comprobante de Domicilio', dbKey: 'comprobanteUrl' },
    { key: 'factura', label: 'Factura proforma o cotización', dbKey: 'facturaUrl' }
  ];

  const handleButtonClick = (key) => {
    setActiveKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeKey) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("El archivo supera el límite de 5MB.");
      return;
    }

    setUploadingKey(activeKey);
    setDocProgress(prev => ({ ...prev, [activeKey]: 1 }));

    try {
      // 1. Subir archivo físico
      const res = await apiSubirDocumento(file, (percent) => {
        setDocProgress(prev => ({ ...prev, [activeKey]: percent }));
      });

      // 2. Mapear y guardar en base de datos
      const updatedDocs = {
        ineUrl: activeKey === 'ine' ? res.url : selectedSolicitud.ineUrl,
        curpUrl: activeKey === 'curp' ? res.url : selectedSolicitud.curpUrl,
        rfcUrl: activeKey === 'rfc' ? res.url : selectedSolicitud.rfcUrl,
        comprobanteUrl: activeKey === 'comprobante' ? res.url : selectedSolicitud.comprobanteUrl,
        facturaUrl: activeKey === 'factura' ? res.url : selectedSolicitud.facturaUrl
      };

      await apiActualizarDocumentos(selectedSolicitud.id, updatedDocs);

      // 3. Actualizar estado reactivamente
      setSelectedSolicitud(prev => ({
        ...prev,
        ...updatedDocs
      }));
      setDocProgress(prev => ({ ...prev, [activeKey]: 100 }));
    } catch (error) {
      console.error("Error al subir archivo pendiente:", error);
      toast.error(`No se pudo cargar el archivo: ${error.message}`);
      setDocProgress(prev => ({ ...prev, [activeKey]: 0 }));
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  const VALID_TRANSITIONS = {
    'REGISTRADA': ['EN REVISIÓN', 'DICTAMINADA', 'FINALIZADA'],
    'EN REVISIÓN': ['REGISTRADA', 'DICTAMINADA', 'FINALIZADA'],
    'DICTAMINADA': ['EN REVISIÓN', 'APROBADA', 'FINALIZADA'],
    'APROBADA': ['DICTAMINADA', 'PAGADA', 'FINALIZADA'],
    'PAGADA': ['APROBADA', 'FINALIZADA'],
    'FINALIZADA': []
  };

  const allowedTransitions = VALID_TRANSITIONS[selectedSolicitud.status] || [];
  const isFinalized = allowedTransitions.length === 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-nayarit-dark to-nayarit-green px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div>
            <span className="text-[10px] bg-nayarit-gold/20 text-nayarit-lightGold px-2.5 py-0.5 rounded-full border border-nayarit-gold/30 font-semibold uppercase tracking-wider">
              Expediente SDR
            </span>
            <h2 className="text-xl font-bold font-sans mt-1">
              Folio: {selectedSolicitud.folio}
            </h2>
          </div>
          <button
            onClick={() => setSelectedSolicitud(null)}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-smooth cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Cuerpo Modal */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1">
          {/* Fila de metadatos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
            <div className="flex gap-3">
              <div className="p-3 bg-nayarit-green/10 text-nayarit-green rounded-2xl shrink-0 h-fit">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Fecha de Registro</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 block">{formatFecha(selectedSolicitud.fechaRegistro)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-3 bg-nayarit-green/10 text-nayarit-green rounded-2xl shrink-0 h-fit">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Programa</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 block truncate max-w-[200px]" title={selectedSolicitud.programa}>
                  {selectedSolicitud.programa}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-3 bg-nayarit-green/10 text-nayarit-green rounded-2xl shrink-0 h-fit">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Componente</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 block">{selectedSolicitud.componente}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Sección 1: Productor / Colectivo */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 text-nayarit-green border-b border-slate-100 pb-2">
                  <UserIcon className="w-4.5 h-4.5" />
                  {selectedSolicitud.moduloTipo === 'INFRAESTRUCTURA' ? 'Datos de la Organización' : 'Datos del Productor'}
                </h3>
                {selectedSolicitud.productor ? (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Tipo Persona</span>
                      <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.productor.tipoPersona}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">RFC / CURP</span>
                      <span className="text-slate-700 mt-0.5 block">
                        {selectedSolicitud.productor.tipoPersona === 'FISICA' 
                          ? selectedSolicitud.productor.curp 
                          : selectedSolicitud.productor.rfc}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Nombre o Razón Social</span>
                      <span className="text-slate-800 mt-0.5 block font-bold text-sm">
                        {selectedSolicitud.productor.tipoPersona === 'FISICA' 
                          ? `${selectedSolicitud.productor.nombre} ${selectedSolicitud.productor.apellidoPaterno} ${selectedSolicitud.productor.apellidoMaterno}` 
                          : selectedSolicitud.productor.nombreOrganizacion}
                      </span>
                    </div>
                    {selectedSolicitud.productor.tipoPersona !== 'FISICA' && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Representante</span>
                        <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.productor.representante}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Municipio</span>
                      <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.productor.municipio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Localidad</span>
                      <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.productor.localidad}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Domicilio</span>
                      <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.productor.domicilio}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Este expediente es de carácter informativo general y no está asociado a un productor individual o colectivo.
                  </p>
                )}
              </div>

              {/* Sección 2: Apoyo Financiero */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 text-nayarit-green border-b border-slate-100 pb-2">
                  <Wallet className="w-4.5 h-4.5" />
                  Datos del Apoyo e Inversión
                </h3>
                {selectedSolicitud.apoyoControl ? (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Concepto</span>
                      <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.apoyoControl.conceptoApoyo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Cantidad / Unidad</span>
                      <span className="text-slate-700 mt-0.5 block">
                        {selectedSolicitud.apoyoControl.cantidad} {selectedSolicitud.apoyoControl.unidadMedida}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Monto Total</span>
                      <span className="text-slate-800 font-bold text-sm mt-0.5 block">
                        {formatMoneda(selectedSolicitud.apoyoControl.montoTotal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Dictamen</span>
                      <span className="text-slate-700 mt-0.5 block">{selectedSolicitud.apoyoControl.dictamen}</span>
                    </div>
                    
                    <div className="col-span-2 border-t border-slate-200/50 pt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <div>Aportación Programa: <strong>{formatMoneda(selectedSolicitud.apoyoControl.aportacionPrograma)}</strong></div>
                      <div>Aportación Solicitante: <strong>{formatMoneda(selectedSolicitud.apoyoControl.aportacionSolicitante)}</strong></div>
                      <div>Aportación Estatal: <strong>{formatMoneda(selectedSolicitud.apoyoControl.aportacionEstatal)}</strong></div>
                      <div>Aportación Federal: <strong>{formatMoneda(selectedSolicitud.apoyoControl.aportacionFederal)}</strong></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Este expediente no cuenta con registro de apoyos monetarios o inversión financiera directa asociada.
                  </p>
                )}
              </div>

              {/* Sección 2.5: Documentos Digitalizados */}
              {selectedSolicitud.moduloTipo !== 'MEDIOS' && selectedSolicitud.moduloTipo !== 'TEMAS_IMPORTANTES' && (
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 text-nayarit-green border-b border-slate-100 pb-2">
                    <FileText className="w-4.5 h-4.5" />
                    Expediente Digital (Documentos)
                  </h3>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />

                  <div className="space-y-2">
                    {docsList.map(doc => {
                      const fileUrl = selectedSolicitud[doc.dbKey];
                      const isUploaded = !!fileUrl;
                      const progress = docProgress[doc.key] || 0;
                      const isUploading = uploadingKey === doc.key && progress < 100;

                      return (
                        <div key={doc.key} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-700 truncate">{doc.label}</span>
                            {isUploaded && (
                              <a
                                href={`http://localhost:5000${fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-nayarit-gold hover:underline font-bold mt-0.5"
                              >
                                Descargar / Ver archivo
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isUploaded ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-150 rounded-full text-[9px] font-bold">
                                Cargado
                              </span>
                            ) : isUploading ? (
                              <span className="text-[10px] text-slate-500 font-bold">{progress}%</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-150 rounded-full text-[9px] font-bold">
                                Pendiente
                              </span>
                            )}

                            {!isAnalista && (
                              <button
                                type="button"
                                onClick={() => handleButtonClick(doc.key)}
                                disabled={isUploading}
                                className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-nayarit-gold rounded-lg border border-slate-150 transition-smooth cursor-pointer"
                                title={isUploaded ? "Reemplazar documento" : "Subir documento pendiente"}
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Sección 3: Datos Técnicos del Módulo */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 text-nayarit-green border-b border-slate-100 pb-2">
                  <FileText className="w-4.5 h-4.5" />
                  Información Técnica del Sector ({formatModulo(selectedSolicitud.moduloTipo)})
                </h3>
                
                <div className="text-xs font-semibold space-y-3">
                  {selectedSolicitud.moduloTipo === 'GANADERIA' && selectedSolicitud.datosGanaderia && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-[10px] text-slate-400 font-medium block">Nombre Predio</span><span className="text-slate-700 block">{selectedSolicitud.datosGanaderia.nombrePredio}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Clave UPP</span><span className="text-slate-700 block">{selectedSolicitud.datosGanaderia.upp}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Coordenada Latitud</span><span className="text-slate-700 block">{selectedSolicitud.datosGanaderia.latitudN}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Coordenada Longitud</span><span className="text-slate-700 block">{selectedSolicitud.datosGanaderia.longitudW}</span></div>
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Inventario Ganadero</span><span className="text-slate-700 block">{selectedSolicitud.datosGanaderia.inventarioGanadero}</span></div>
                    </div>
                  )}

                  {selectedSolicitud.moduloTipo === 'AGRICULTURA_FRIJOL' && selectedSolicitud.datosAgriculturaFrijol && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-[10px] text-slate-400 font-medium block">Municipio del Acta</span><span className="text-slate-700 block">{selectedSolicitud.datosAgriculturaFrijol.municipioActa}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Semilla Autorizada (kg)</span><span className="text-slate-700 block">{selectedSolicitud.datosAgriculturaFrijol.cantidadAutorizadaKg} kg</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Superficie Autorizada (ha)</span><span className="text-slate-700 block">{selectedSolicitud.datosAgriculturaFrijol.superficieAutorizadaHa} ha</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Variedad de Frijol</span><span className="text-slate-700 block">{selectedSolicitud.datosAgriculturaFrijol.variedadSemillaCertificada}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Título de Propiedad</span><span className="text-slate-700 block">{selectedSolicitud.datosAgriculturaFrijol.tituloPropiedad}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Número Documento</span><span className="text-slate-700 block">{selectedSolicitud.datosAgriculturaFrijol.numeroDocumento}</span></div>
                    </div>
                  )}

                  {selectedSolicitud.moduloTipo === 'PESCA_ACUACULTURA' && selectedSolicitud.datosPescaAcuacultura && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Unidad Productiva</span><span className="text-slate-700 block">{selectedSolicitud.datosPescaAcuacultura.domicilioUnidadProductiva}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Registro RNPA</span><span className="text-slate-700 block">{selectedSolicitud.datosPescaAcuacultura.rnpa}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Permiso de Pesca</span><span className="text-slate-700 block">{selectedSolicitud.datosPescaAcuacultura.permisoPesca}</span></div>
                    </div>
                  )}

                  {selectedSolicitud.moduloTipo === 'INFRAESTRUCTURA' && selectedSolicitud.datosInfraestructura && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Distrito/Unidad de Riego</span><span className="text-slate-700 block">{selectedSolicitud.datosInfraestructura.domicilioUnidadDistritoRiego}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Municipio</span><span className="text-slate-700 block">{selectedSolicitud.datosInfraestructura.municipio}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Localidad</span><span className="text-slate-700 block">{selectedSolicitud.datosInfraestructura.localidad}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Título Concesión CONAGUA</span><span className="text-slate-700 block">{selectedSolicitud.datosInfraestructura.concesionAgua || 'No registrado'}</span></div>
                    </div>
                  )}

                  {selectedSolicitud.moduloTipo === 'MAQUINARIA' && selectedSolicitud.datosMaquinaria && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-[10px] text-slate-400 font-medium block">Rama Productiva</span><span className="text-slate-700 block">{selectedSolicitud.datosMaquinaria.ramaProductiva || 'General'}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Plazo Solicitado</span><span className="text-slate-700 block">{selectedSolicitud.datosMaquinaria.plazoSolicitado}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Contacto Operación</span><span className="text-slate-700 block">{selectedSolicitud.datosMaquinaria.nombreContacto}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Teléfono Operación</span><span className="text-slate-700 block">{selectedSolicitud.datosMaquinaria.telefonoContacto}</span></div>
                    </div>
                  )}

                  {selectedSolicitud.moduloTipo === 'MEDIOS' && selectedSolicitud.datosMedios && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-[10px] text-slate-400 font-medium block">Subsecretaría</span><span className="text-slate-700 block">{selectedSolicitud.datosMedios.subsecretaria}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Tipo Reporte</span><span className="text-slate-700 block">{selectedSolicitud.datosMedios.tipoReporte}</span></div>
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Asunto / Tema</span><span className="text-slate-700 block font-semibold">{selectedSolicitud.datosMedios.asuntoTema}</span></div>
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Resumen / Reporte</span><span className="text-slate-600 block mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">{selectedSolicitud.datosMedios.reporteResumen}</span></div>
                    </div>
                  )}

                  {selectedSolicitud.moduloTipo === 'TEMAS_IMPORTANTES' && selectedSolicitud.datosTemasImportantes && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-[10px] text-slate-400 font-medium block">Clasificación</span><span className="text-slate-700 block">{selectedSolicitud.datosTemasImportantes.tipo}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-medium block">Área SEDER</span><span className="text-slate-700 block">{selectedSolicitud.datosTemasImportantes.areaSeder || 'General'}</span></div>
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Descripción Temática</span><span className="text-slate-700 block font-semibold">{selectedSolicitud.datosTemasImportantes.descripcion}</span></div>
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">¿Cómo se atiende?</span><span className="text-slate-700 block mt-0.5">{selectedSolicitud.datosTemasImportantes.comoSeAtiende}</span></div>
                      <div className="col-span-2"><span className="text-[10px] text-slate-400 font-medium block">Resumen / Reporte</span><span className="text-slate-600 block mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">{selectedSolicitud.datosTemasImportantes.reporteResumen}</span></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bitácora de Trazabilidad */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 text-nayarit-green">
                  Historial de Estatus (Trazabilidad)
                </h3>
                
                <div className="border-l-2 border-slate-200/80 pl-4 space-y-4 ml-2">
                  {selectedSolicitud.historialEstatus?.map((log, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-nayarit-green ring-4 ring-white" />
                      <div className="text-[11px] font-semibold text-slate-700">
                        {log.estatus}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{log.comentario}</p>
                      <div className="text-[9px] text-slate-400 font-medium mt-1">
                        Por: {log.funcionario} • {formatFecha(log.fechaChange)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario de Cambios de Estatus */}
              <div className="bg-nayarit-light/50 border border-nayarit-green/10 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-nayarit-dark uppercase tracking-wider">
                  Dictamen / Estatus del Expediente
                </h4>
                
                {isAnalista ? (
                  <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2.5 font-medium">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      <strong>Modo Solo Lectura (Analista):</strong> No posees permisos para modificar el estatus ni agregar dictámenes.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateEstatus} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <select
                          value={newEstatus}
                          onChange={e => setNewEstatus(e.target.value)}
                          disabled={isFinalized}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold font-semibold disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value={selectedSolicitud.status}>{selectedSolicitud.status} (Actual)</option>
                          {allowedTransitions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <textarea
                          value={estatusComentario}
                          onChange={e => setEstatusComentario(e.target.value)}
                          placeholder={isFinalized ? "Este expediente ha sido finalizado. No se permiten más comentarios." : "Añade un comentario sobre este cambio de estatus..."}
                          disabled={isFinalized}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-nayarit-gold h-16 disabled:bg-slate-50 disabled:text-slate-400"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={updateLoading || isFinalized || newEstatus === selectedSolicitud.status}
                      className="w-full py-2 px-4 bg-nayarit-green hover:bg-nayarit-dark text-white rounded-xl text-xs font-semibold transition-smooth flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {updateLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Registrar Cambio de Estatus'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
