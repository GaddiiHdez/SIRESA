import React, { useState, useEffect } from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function FormInfraestructura({ datosEspecif, onChange, catalogos }) {
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Datos de Infraestructura y Obras Rurales (Pág. 9 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Domicilio de la Unidad o Distrito de Riego"
          value={datosEspecif.domicilioUnidadDistritoRiego}
          onChange={val => onChange('domicilioUnidadDistritoRiego', val)}
          placeholder="Ej. Distrito de Riego 043, Ejido Sayulilla"
          required
          className="col-span-2"
        />

        <FormSelect
          label="Municipio"
          value={datosEspecif.municipio || ''}
          onChange={handleMunicipioChange}
          options={['Selecciona municipio', ...(catalogos?.municipios || [])]}
          required
        />

        <FormSelect
          label="Localidad (Comunidad)"
          value={datosEspecif.localidad || ''}
          onChange={val => onChange('localidad', val)}
          options={localidadesFiltradas.length > 0 ? localidadesFiltradas : ['Selecciona municipio primero']}
          required
        />

        <FormInput
          label="Título de Concesión de Agua (CONAGUA)"
          value={datosEspecif.concesionAgua}
          onChange={val => onChange('concesionAgua', val)}
          placeholder="Número de Registro"
        />

        <FormInput
          label="Acta Constitutiva de la Asociación"
          value={datosEspecif.actaConstitutiva}
          onChange={val => onChange('actaConstitutiva', val)}
          placeholder="Ej. AC-452-Tepic"
        />

        <FormInput
          label="Fecha del Acta Constitutiva"
          type="date"
          value={datosEspecif.fechaActaConstitutiva}
          onChange={val => onChange('fechaActaConstitutiva', val)}
        />
      </div>
    </div>
  );
}
