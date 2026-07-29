import React, { useState, useEffect } from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function FormGanaderia({ datosEspecif, onChange, catalogos }) {
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
        Datos Técnicos de Ganadería (Pág. 6 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Nombre del Predio / Rancho"
          value={datosEspecif.nombrePredio}
          onChange={val => onChange('nombrePredio', val)}
          placeholder="Ej. El Clarín"
          required
        />

        <FormInput
          label="Clave UPP (Unidad de Producción Pecuaria)"
          value={datosEspecif.upp}
          onChange={val => onChange('upp', val)}
          placeholder="Ej. 18-020-45289-01"
          required
        />

        <FormInput
          label="Coordenada Latitud (Norte)"
          value={datosEspecif.latitudN}
          onChange={val => onChange('latitudN', val)}
          placeholder={"Ej. 21°30'15\""}
          required
        />

        <FormInput
          label="Coordenada Longitud (Oeste)"
          value={datosEspecif.longitudW}
          onChange={val => onChange('longitudW', val)}
          placeholder={"Ej. 104°53'45\""}
          required
        />

        <FormInput
          label="Folio Credencial Ganadera"
          value={datosEspecif.credencialGanadera}
          onChange={val => onChange('credencialGanadera', val)}
          placeholder="Número de Registro"
        />

        <FormInput
          label="Inventario Ganadero Estimado"
          value={datosEspecif.inventarioGanadero}
          onChange={val => onChange('inventarioGanadero', val)}
          placeholder="Ej. 24 cabezas bovinas"
        />

        <FormSelect
          label="Municipio Ubicación Predio"
          value={datosEspecif.municipio || ''}
          onChange={handleMunicipioChange}
          options={['Selecciona municipio', ...(catalogos?.municipios || [])]}
          required
        />

        <FormSelect
          label="Localidad Ubicación Predio"
          value={datosEspecif.localidad || ''}
          onChange={val => onChange('localidad', val)}
          options={localidadesFiltradas.length > 0 ? localidadesFiltradas : ['Selecciona municipio primero']}
          required
        />
      </div>
    </div>
  );
}
