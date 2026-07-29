import React, { useState, useEffect } from 'react';
import { apiCrearSolicitud, apiSubirDocumento } from '../../../shared/services/api';
import useCatalogos from '../../../shared/hooks/useCatalogos';
import { formatModulo } from '../../../shared/utils/formatters';
import { toast } from '../../../shared/utils/toast';
import { getFlowSteps } from '../../../shared/config/sectoresMetadata';
import SeleccionModulo from '../components/SeleccionModulo';
import HorizontalStepper from '../components/HorizontalStepper';
import PasoGenerales from '../components/PasoGenerales';
import PasoProductor from '../../productores/components/PasoProductor';
import PasoApoyo from '../components/PasoApoyo';
import PasoEspecifico from '../components/PasoEspecifico';
import PasoDocumentos from '../components/PasoDocumentos';
import PasoExito from '../components/PasoExito';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';

export default function NuevaSolicitudPage({ onSaveSuccess }) {
  const [step, setStep] = useState(0); // Paso 0: Selección de módulo, 1 a 5: Pasos, 6: Éxito
  const [moduloTipo, setModuloTipo] = useState('');
  
  const activeSteps = getFlowSteps(moduloTipo);
  const isLastStep = step === activeSteps[activeSteps.length - 1];

  const { catalogos, loading: catsLoading } = useCatalogos();
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState([]);
  
  // Datos del Formulario
  const [formData, setFormData] = useState({
    fechaRegistro: new Date().toISOString().split('T')[0],
    fechaSolicitud: new Date().toISOString().split('T')[0],
    programa: '',
    componente: '',
    productor: {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      rfc: '',
      curp: '',
      tipoPersona: 'FISICA',
      nombreOrganizacion: '',
      representante: '',
      genero: 'Hombre',
      indigena: 'NO',
      etnia: '',
      discapacidad: 'NO',
      tipoDiscapacidad: '',
      beneficiariosHombres: '',
      beneficiariosMujeres: '',
      tipoIdentificacion: 'INE',
      folioIdentificacion: '',
      domicilio: '',
      telefono: '',
      municipio: '',
      localidad: ''
    },
    apoyoControl: {
      gradoMarginacion: 'Medio',
      superficie: '',
      tenenciaTierra: 'Ejidal',
      conceptoApoyo: '',
      unidadMedida: '',
      cantidad: '',
      especificacionApoyo: '',
      montoTotal: '',
      aportacionPrograma: '',
      aportacionSolicitante: '',
      aportacionEstatal: '',
      aportacionFederal: '',
      priorizacion: 'Media',
      dictamen: 'Sin Dictamen',
      comentarioDictamen: '',
      sesionOd: '',
      fechaSesionOd: '',
      factura: '',
      proveedor: '',
      rfcProveedor: '',
      montoPagado: '',
      economia: '',
      fechaPago: '',
      trimestre: 'Primer'
    },
    datosEspecif: {}
  });

  const [loading, setLoading] = useState(false);
  const [successFolio, setSuccessFolio] = useState('');
  
  // URLs de documentos cargados en Paso 5
  const [documentosCargados, setDocumentosCargados] = useState({
    ine: null,
    curp: null,
    rfc: null,
    comprobante: null,
    factura: null
  });
  const [docProgress, setDocProgress] = useState({});

  // 1. Notificar al Layout sobre el estado del navbar dinámico
  useEffect(() => {
    const isCapturing = step > 0 && step < 6;
    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        active: isCapturing,
        moduloTipo: moduloTipo,
        label: isCapturing ? "CAPTURA DE EXPEDIENTE" : "REGISTRO DE EXPEDIENTES",
        title: isCapturing ? formatModulo(moduloTipo) : "NUEVA SOLICITUD",
        iconKey: isCapturing ? moduloTipo : "REGISTRO",
        actions: isCapturing 
          ? [
              { id: "rellenar", text: "Rellenar Prueba" },
              { id: "cancelar", text: "Cancelar Captura" }
            ]
          : [
              { id: "navigate-consultar", text: "Consultar Expedientes" }
            ]
      }
    }));
  }, [step, moduloTipo]);

  // 2. Escuchar las acciones que ocurren en el navbar dinámico
  useEffect(() => {
    const onRellenar = () => fillWithTestData();
    const onCancelar = () => handleReset();

    window.addEventListener('sdr-navbar-action-rellenar', onRellenar);
    window.addEventListener('sdr-navbar-action-cancelar', onCancelar);

    return () => {
      window.removeEventListener('sdr-navbar-action-rellenar', onRellenar);
      window.removeEventListener('sdr-navbar-action-cancelar', onCancelar);
    };
  }, [step, formData, moduloTipo]);

  // Filtrar localidades cuando cambie el municipio del productor
  useEffect(() => {
    if (catalogos && formData.productor.municipio) {
      const locs = catalogos.municipiosLocalidades[formData.productor.municipio] || [];
      setLocalidadesFiltradas(locs);
      setFormData(prev => ({
        ...prev,
        productor: {
          ...prev.productor,
          localidad: locs[0] || ''
        }
      }));
    }
  }, [formData.productor.municipio, catalogos]);

  // Selección de Módulo (Paso 0)
  const handleSelectModulo = (tipo) => {
    setModuloTipo(tipo);
    const today = new Date().toISOString().split('T')[0];
    const steps = getFlowSteps(tipo);

    setFormData(prev => {
      const isInfo = tipo === 'MEDIOS' || tipo === 'TEMAS_IMPORTANTES';
      const progInfo = catalogos?.programasComponentes[tipo];

      return {
        ...prev,
        programa: isInfo 
          ? (tipo === 'MEDIOS' ? "DIFUSIÓN E INFORMACIÓN PÚBLICA" : "TEMAS IMPORTANTES Y CONTINGENCIAS")
          : (progInfo?.programa || ''),
        componente: isInfo 
          ? (tipo === 'MEDIOS' ? "BOLETÍN DE PRENSA" : "REPORTE DE INCIDENCIA")
          : (progInfo?.componentes[0] || ''),
        fechaRegistro: today,
        fechaSolicitud: today,
        datosEspecif: isInfo ? { fecha: today } : {}
      };
    });
    setStep(steps[0]);
  };

  const handleProductorChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      productor: { ...prev.productor, [field]: val }
    }));
  };

  const handleApoyoChange = (field, val) => {
    setFormData(prev => {
      const updatedApoyo = { ...prev.apoyoControl, [field]: val };
      
      if (field === 'montoTotal') {
        const total = parseFloat(val) || 0;
        updatedApoyo.aportacionPrograma = (total * 0.7).toFixed(2);
        updatedApoyo.aportacionSolicitante = (total * 0.3).toFixed(2);
        updatedApoyo.aportacionEstatal = '0.00';
        updatedApoyo.aportacionFederal = '0.00';
      }

      return {
        ...prev,
        apoyoControl: updatedApoyo
      };
    });
  };

  const handleEspecifChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      datosEspecif: { ...prev.datosEspecif, [field]: val }
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      return formData.programa && formData.componente;
    }
    if (step === 2) {
      const p = formData.productor;
      if (p.tipoPersona === 'FISICA') {
        return p.nombre && p.apellidoPaterno && p.curp && p.domicilio && p.telefono && p.municipio && p.localidad;
      } else {
        return p.nombreOrganizacion && p.representante && p.rfc && p.domicilio && p.telefono && p.municipio && p.localidad;
      }
    }
    if (step === 3) {
      const a = formData.apoyoControl;
      return a.conceptoApoyo && a.unidadMedida && a.cantidad && a.montoTotal;
    }
    if (step === 4) {
      const e = formData.datosEspecif;
      if (moduloTipo === 'GANADERIA') {
        return e.nombrePredio && e.upp && e.latitudN && e.longitudW;
      }
      if (moduloTipo === 'AGRICULTURA_FRIJOL') {
        return e.municipioActa && e.variedadSemillaCertificada && e.cantidadAutorizadaKg && e.superficieAutorizadaHa;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      const currentIndex = activeSteps.indexOf(step);
      if (currentIndex < activeSteps.length - 1) {
        const nextStep = activeSteps[currentIndex + 1];

        if (nextStep === 2 && moduloTipo === 'INFRAESTRUCTURA' && formData.productor.tipoPersona === 'FISICA') {
          setFormData(prev => ({
            ...prev,
            productor: { ...prev.productor, tipoPersona: 'MORAL' }
          }));
        }

        setStep(nextStep);
      }
    } else {
      toast.warning("Por favor completa los campos obligatorios antes de continuar.");
    }
  };

  const handleBack = () => {
    const currentIndex = activeSteps.indexOf(step);
    if (currentIndex > 0) {
      setStep(activeSteps[currentIndex - 1]);
    } else {
      setStep(0);
    }
  };

  const fillWithTestData = () => {
    const today = new Date().toISOString().split('T')[0];
    if (step === 1) {
      setFormData(prev => ({ ...prev, fechaRegistro: today, fechaSolicitud: today }));
    }
    if (step === 2) {
      const isColectivo = moduloTipo === 'INFRAESTRUCTURA';
      setFormData(prev => ({
        ...prev,
        productor: {
          ...prev.productor,
          tipoPersona: isColectivo ? 'MORAL' : 'FISICA',
          nombre: isColectivo ? '' : 'Juan',
          apellidoPaterno: isColectivo ? '' : 'García',
          apellidoMaterno: isColectivo ? '' : 'López',
          nombreOrganizacion: isColectivo ? 'Asociación de Usuarios de Riego Nayarit A.C.' : '',
          representante: isColectivo ? 'Ing. Carlos Fuentes Ruiz' : '',
          rfc: isColectivo ? 'AUR200815AB9' : 'GALJ800101AB1',
          curp: isColectivo ? '' : 'GALJ800101HNYRPN09',
          genero: 'Hombre', indigena: 'NO', discapacidad: 'NO',
          tipoIdentificacion: 'INE', folioIdentificacion: 'IDX-1234567',
          domicilio: 'Calle Morelos 45, Col. Centro', telefono: '3111234567',
          municipio: 'Tepic', localidad: 'Tepic',
          beneficiariosHombres: isColectivo ? '45' : '2',
          beneficiariosMujeres: isColectivo ? '30' : '1'
        }
      }));
      if (catalogos?.municipiosLocalidades?.['Tepic']) {
        setLocalidadesFiltradas(catalogos.municipiosLocalidades['Tepic']);
      }
    }
    if (step === 3) {
      setFormData(prev => ({
        ...prev,
        apoyoControl: {
          ...prev.apoyoControl,
          conceptoApoyo: 'Semilla Certificada de Frijol Pinto',
          unidadMedida: 'Kilogramos', cantidad: '50',
          montoTotal: '15000', aportacionPrograma: '10500',
          aportacionSolicitante: '4500', aportacionEstatal: '0', aportacionFederal: '0',
          gradoMarginacion: 'Medio', tenenciaTierra: 'Ejidal', priorizacion: 'Alta',
          superficie: '5', trimestre: 'Primer',
          dictamen: 'Sin Dictamen'
        }
      }));
    }
    if (step === 4) {
      const testData = {
        GANADERIA: { nombrePredio: 'El Clarín', upp: '18-020-45289-01', latitudN: "21°30'15\"", longitudW: "104°53'45\"", municipio: 'Tepic', localidad: 'Tepic', inventarioGanadero: '24 cabezas bovinas' },
        AGRICULTURA_FRIJOL: { municipioActa: 'Santiago Ixcuintla', localidadActa: 'Villa Hidalgo', fechaActa: today, variedadSemillaCertificada: 'Pinto Saltillo', cantidadAutorizadaKg: '50', superficieAutorizadaHa: '5', numeroBultos: '2', tituloPropiedad: 'Certificado Parcelario' },
        PESCA_ACUACULTURA: { domicilioUnidadProductiva: 'Laguna de Mexcaltitán', municipio: 'Tepic', localidad: 'Tepic', permisoPesca: 'PESC-2024-001', rnpa: 'RNPA-12345' },
        INFRAESTRUCTURA: { domicilioUnidadDistritoRiego: 'Ejido Sayulilla, Dist. 043', municipio: 'Tepic', localidad: 'Tepic' },
        MAQUINARIA: { tractor: 'SI', ramaProductiva: 'Maíz', plazoSolicitado: '10 días', nombreContacto: 'Pedro Ruiz', telefonoContacto: '3119876543', fechaSolicitada: today },
        MEDIOS: { subsecretaria: 'Agricultura', direccionDepartamento: 'Fomento Pecuario', tipoReporte: 'Entrega', fecha: today, lugar: 'Auditorio SEDER Tepic', asuntoTema: 'Entrega de Apoyos Agrícolas', reporteResumen: 'Se llevó a cabo la entrega oficial de apoyos a productores del estado de Nayarit.' },
        TEMAS_IMPORTANTES: { tipo: 'Problemática', descripcion: 'Plaga de chicharrita en cultivos de maíz', areaSeder: 'Agricultura', quienesIntervienen: 'SENASICA', comoSeAtiende: 'Aplicación de insecticidas selectivos por parte de técnicos SADER', reporteResumen: 'Se atendió la problemática mediante distribución de insumos y asesoría técnica.' }
      };
      setFormData(prev => ({
        ...prev,
        datosEspecif: { ...prev.datosEspecif, ...(testData[moduloTipo] || {}) }
      }));
    }
  };

  const handleUploadReal = async (docKey, file) => {
    setDocProgress(prev => ({ ...prev, [docKey]: 1 }));
    try {
      const res = await apiSubirDocumento(file, (percent) => {
        setDocProgress(prev => ({ ...prev, [docKey]: percent }));
      });
      setDocumentosCargados(prev => ({ ...prev, [docKey]: res.url }));
      setDocProgress(prev => ({ ...prev, [docKey]: 100 }));
    } catch (error) {
      console.error("Error al subir archivo:", error);
      toast.error(`No se pudo subir el archivo: ${error.message}`);
      setDocProgress(prev => ({ ...prev, [docKey]: 0 }));
      setDocumentosCargados(prev => ({ ...prev, [docKey]: null }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const isInfo = moduloTipo === 'MEDIOS' || moduloTipo === 'TEMAS_IMPORTANTES';
      const payload = {
        fechaRegistro: isInfo ? (formData.datosEspecif.fecha || formData.fechaRegistro) : formData.fechaRegistro,
        fechaSolicitud: isInfo ? (formData.datosEspecif.fecha || formData.fechaSolicitud) : formData.fechaSolicitud,
        programa: formData.programa,
        componente: formData.componente,
        moduloTipo,
        productor: isInfo ? null : formData.productor,
        apoyoControl: (isInfo || moduloTipo === 'MAQUINARIA' || moduloTipo === 'INFRAESTRUCTURA') ? null : formData.apoyoControl,
        datosEspecif: formData.datosEspecif,
        // Guardar URLs de archivos reales
        ineUrl: documentosCargados.ine || null,
        curpUrl: documentosCargados.curp || null,
        rfcUrl: documentosCargados.rfc || null,
        comprobanteUrl: documentosCargados.comprobante || null,
        facturaUrl: documentosCargados.factura || null
      };

      const result = await apiCrearSolicitud(payload);
      setSuccessFolio(result.folio);
      setStep(6);
    } catch (error) {
      console.error("Error al guardar solicitud:", error);
      toast.error(`Error al guardar el expediente: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setFormData({
      fechaRegistro: new Date().toISOString().split('T')[0],
      fechaSolicitud: new Date().toISOString().split('T')[0],
      programa: '',
      componente: '',
      productor: { nombre: '', apellidoPaterno: '', apellidoMaterno: '', rfc: '', curp: '', tipoPersona: 'FISICA', nombreOrganizacion: '', representante: '', genero: 'Hombre', indigena: 'NO', etnia: '', discapacidad: 'NO', tipoDiscapacidad: '', beneficiariosHombres: '', beneficiariosMujeres: '', tipoIdentificacion: 'INE', folioIdentificacion: '', domicilio: '', telefono: '', municipio: '', localidad: '' },
      apoyoControl: { gradoMarginacion: 'Medio', superficie: '', tenenciaTierra: 'Ejidal', conceptoApoyo: '', unidadMedida: '', cantidad: '', especificacionApoyo: '', montoTotal: '', aportacionPrograma: '', aportacionSolicitante: '', aportacionEstatal: '', aportacionFederal: '', priorizacion: 'Media', dictamen: 'Sin Dictamen', comentarioDictamen: '', sesionOd: '', fechaSesionOd: '', factura: '', proveedor: '', rfcProveedor: '', montoPagado: '', economia: '', fechaPago: '', trimestre: 'Primer' },
      datosEspecif: {}
    });
    setDocumentosCargados({ ine: null, curp: null, rfc: null, comprobante: null, factura: null });
    setDocProgress({});
  };

  if (catsLoading || !catalogos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-nayarit-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Paso 0: Selección de Módulo
  if (step === 0) {
    return <SeleccionModulo handleSelectModulo={handleSelectModulo} />;
  }

  // Paso 6: Éxito
  if (step === 6) {
    return (
      <PasoExito
        successFolio={successFolio}
        registradoPor={formData.productor.nombre ? `${formData.productor.nombre} ${formData.productor.apellidoPaterno}` : ''}
        onReset={handleReset}
        onGoToList={onSaveSuccess}
      />
    );
  }

  const stepTitles = {
    1: "Datos Generales",
    2: moduloTipo === 'INFRAESTRUCTURA' ? "Datos del Colectivo" : "Datos del Beneficiario",
    3: "Apoyo Financiero",
    4: (moduloTipo === 'MEDIOS' || moduloTipo === 'TEMAS_IMPORTANTES') ? "Contenido del Reporte" : "Formulario Técnico",
    5: "Documentación"
  };

  return (
    <div className="flex flex-col h-auto md:h-[calc(100vh-140px)] w-full gap-4 overflow-hidden md:overflow-visible animate-fadeIn">
      {/* 1. Stepper Horizontal Superior */}
      {activeSteps.length > 1 && (
        <HorizontalStepper
          step={step}
          activeSteps={activeSteps}
          stepTitles={stepTitles}
        />
      )}

      {/* 2. Área del Formulario (Ancho Completo) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200/80 rounded-3xl shadow-sm relative">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-nayarit-gold via-yellow-400 to-nayarit-lightGreen z-10" />

          {/* Área de scroll del formulario */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 md:pb-24 space-y-6">
            {step === 1 && (
              <PasoGenerales
                formData={formData}
                setFormData={setFormData}
                catalogos={catalogos}
                moduloTipo={moduloTipo}
              />
            )}

            {step === 2 && (
              <PasoProductor
                productor={formData.productor}
                onChange={handleProductorChange}
                catalogos={catalogos}
                localidadesFiltradas={localidadesFiltradas}
                isColectivoOnly={moduloTipo === 'INFRAESTRUCTURA'}
              />
            )}

            {step === 3 && (
              <PasoApoyo
                apoyoControl={formData.apoyoControl}
                onChange={handleApoyoChange}
                catalogos={catalogos}
              />
            )}

            {step === 4 && (
              <PasoEspecifico
                moduloTipo={moduloTipo}
                datosEspecif={formData.datosEspecif}
                onChange={handleEspecifChange}
                catalogos={catalogos}
              />
            )}

            {step === 5 && (
              <PasoDocumentos
                documentosCargados={documentosCargados}
                docProgress={docProgress}
                onUpload={handleUploadReal}
              />
            )}
          </div>

          {/* Barra de botones sticky al fondo */}
          <div className="flex-shrink-0 bg-slate-50/95 backdrop-blur-sm border-t border-slate-100 py-4 px-6 md:px-8 flex justify-between items-center rounded-b-3xl z-10">
            <button
              type="button"
              onClick={handleBack}
              className={`flex items-center gap-1.5 px-6 py-3.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-xl text-xs font-extrabold transition-smooth uppercase tracking-wider shadow-xs cursor-pointer ${
                step === activeSteps[0] ? 'opacity-0 pointer-events-none' : ''
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1.5 px-8 py-3.5 bg-nayarit-green hover:bg-nayarit-lightGreen text-white rounded-xl text-xs font-extrabold transition-smooth shadow-md shadow-nayarit-green/10 uppercase tracking-wider active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Expediente
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-8 py-3.5 bg-nayarit-green hover:bg-nayarit-lightGreen text-white rounded-xl text-xs font-extrabold transition-smooth shadow-md shadow-nayarit-green/10 uppercase tracking-wider active:scale-95 cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
