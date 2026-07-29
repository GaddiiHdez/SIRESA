import React, { useState, useEffect } from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function FormMedios({ datosEspecif, onChange, catalogos }) {
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState([]);

  useEffect(() => {
    if (datosEspecif.municipio && catalogos?.municipiosLocalidades) {
      setLocalidadesFiltradas(catalogos.municipiosLocalidades[datosEspecif.municipio] || []);
    } else {
      setLocalidadesFiltradas([]);
    }
  }, [datosEspecif.municipio, catalogos]);

  const handleMunicipioChange = (val) => {
    onChange('municipio', val);
    onChange('localidad', '');
  };

  const subsecretarias = [
    'Ganadería',
    'Agricultura',
    'Pesca y Acuacultura',
    'Desarrollo Rural'
  ];

  const direcciones = [
    'Fomento Pecuario',
    'Cafeticultura',
    'Pesca',
    'Central de Maquinaria',
    'Etc.'
  ];

  const tiposReporte = [
    'Reunión',
    'Comisión',
    'Evento',
    'Entrega',
    'Otro'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Información para Medios (Pág. 12 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormSelect
          label="Subsecretaría"
          value={datosEspecif.subsecretaria}
          onChange={val => onChange('subsecretaria', val)}
          options={subsecretarias}
          required
        />

        <FormSelect
          label="Dirección/Departamento"
          value={datosEspecif.direccionDepartamento}
          onChange={val => onChange('direccionDepartamento', val)}
          options={direcciones}
          required
        />

        <FormSelect
          label="Tipo de Reporte"
          value={datosEspecif.tipoReporte}
          onChange={val => onChange('tipoReporte', val)}
          options={tiposReporte}
          required
        />

        <FormInput
          label="Fecha"
          type="date"
          value={datosEspecif.fecha}
          onChange={val => onChange('fecha', val)}
          required
        />

        <FormInput
          label="Lugar / Sede"
          value={datosEspecif.lugar}
          onChange={val => onChange('lugar', val)}
          placeholder="Lugar del evento"
          required
        />

        <FormSelect
          label="Municipio del Evento"
          value={datosEspecif.municipio || ''}
          onChange={handleMunicipioChange}
          options={['Selecciona municipio', ...(catalogos?.municipios || [])]}
          required
        />

        <FormSelect
          label="Localidad del Evento"
          value={datosEspecif.localidad || ''}
          onChange={val => onChange('localidad', val)}
          options={localidadesFiltradas.length > 0 ? localidadesFiltradas : ['Selecciona municipio primero']}
          required
        />

        <FormInput
          label="Asunto / Tema"
          value={datosEspecif.asuntoTema}
          onChange={val => onChange('asuntoTema', val)}
          placeholder="Asunto principal"
          required
          className="col-span-2"
        />

        <FormInput
          label="Quienes Intervienen"
          value={datosEspecif.quienesIntervienen}
          onChange={val => onChange('quienesIntervienen', val)}
          placeholder="Autoridades / Invitados"
          className="col-span-2"
        />

        <div className="space-y-1.5 col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Reporte / Resumen <span className="text-red-500">*</span>
          </label>
          <textarea
            value={datosEspecif.reporteResumen || ''}
            onChange={e => onChange('reporteResumen', e.target.value)}
            placeholder="Resumen del boletín oficial o nota de prensa..."
            className="w-full px-3.5 py-3 glass-input rounded-xl text-slate-800 text-sm h-28 focus:outline-none focus:border-nayarit-gold bg-white font-semibold"
            required
          />
        </div>

        <FormInput
          label="Agregar Material Fotográfico, de Video o Documentos"
          value={datosEspecif.archivosMaterial}
          onChange={val => onChange('archivosMaterial', val)}
          placeholder="Enlaces o nombres de archivos de medios"
          className="col-span-2"
        />
      </div>
    </div>
  );
}
