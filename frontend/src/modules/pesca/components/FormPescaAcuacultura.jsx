import React, { useState, useEffect } from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function FormPescaAcuacultura({ datosEspecif, onChange, catalogos }) {
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
        Datos Técnicos de Pesca y Acuacultura (Pág. 8 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Domicilio de la Unidad Productiva / Estero / Embalse"
          value={datosEspecif.domicilioUnidadProductiva}
          onChange={val => onChange('domicilioUnidadProductiva', val)}
          placeholder="Ubicación física"
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
          label="Fecha de Pago Cría"
          type="date"
          value={datosEspecif.fechaPagoCria}
          onChange={val => onChange('fechaPagoCria', val)}
        />

        <FormInput
          label="Permiso de Pesca Comercial Vigente"
          value={datosEspecif.permisoPesca}
          onChange={val => onChange('permisoPesca', val)}
          placeholder="Número de Permiso"
        />

        <FormInput
          label="Acta Constitutiva Cooperativa"
          value={datosEspecif.actaConstitutiva}
          onChange={val => onChange('actaConstitutiva', val)}
          placeholder="Número de Acta o Folio"
        />

        <FormInput
          label="Fecha del Acta Constitutiva"
          type="date"
          value={datosEspecif.fechaActaConstitutiva}
          onChange={val => onChange('fechaActaConstitutiva', val)}
        />

        <FormInput
          label="Registro RNPA (Nacional de Pesca y Acuacultura)"
          value={datosEspecif.rnpa}
          onChange={val => onChange('rnpa', val)}
          placeholder="Clave RNPA"
        />

        <FormInput
          label="Manifestación de Impacto Ambiental (MIA)"
          value={datosEspecif.manifestacionImpactoAmbiental}
          onChange={val => onChange('manifestacionImpactoAmbiental', val)}
          placeholder="Folio de resolución"
        />

        <FormInput
          label="Resolución Administrativa de PROFEPA"
          value={datosEspecif.resolucionProfepa}
          onChange={val => onChange('resolucionProfepa', val)}
          placeholder="Número de Oficio"
        />

        <FormInput
          label="Legal Posesión del Predio / Zona Federal"
          value={datosEspecif.legalPossesion}
          onChange={val => onChange('legalPossesion', val)}
          placeholder="Título / Concesión"
        />

        <FormInput
          label="Factura del Bien a Sustituir (Motor, Embarcación, etc.)"
          value={datosEspecif.facturaBienSustituir}
          onChange={val => onChange('facturaBienSustituir', val)}
          placeholder="Folio factura del bien usado"
        />
      </div>
    </div>
  );
}
