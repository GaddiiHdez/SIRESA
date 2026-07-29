import React, { useState, useEffect } from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function FormAgriculturaFrijol({ datosEspecif, onChange, catalogos }) {
  const [localidadesFiltradas, setLocalidadesFiltradas] = useState([]);

  useEffect(() => {
    if (datosEspecif.municipioActa && catalogos?.municipiosLocalidades) {
      setLocalidadesFiltradas(catalogos.municipiosLocalidades[datosEspecif.municipioActa] || []);
    } else {
      setLocalidadesFiltradas([]);
    }
  }, [datosEspecif.municipioActa, catalogos]);

  const handleMunicipioChange = (val) => {
    onChange('municipioActa', val);
    onChange('localidadActa', '');
  };

  const titulosPropiedad = [
    'Certificado Parcelario',
    'Constancia de Posesión',
    'Contrato de Arrendamiento',
    'Carta Poder',
    'Otro'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Datos Técnicos de Agricultura (Pág. 7 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormSelect
          label="Municipio del Acta"
          value={datosEspecif.municipioActa || ''}
          onChange={handleMunicipioChange}
          options={['Selecciona municipio', ...(catalogos?.municipios || [])]}
          required
        />

        <FormSelect
          label="Localidad del Acta (Comunidad)"
          value={datosEspecif.localidadActa || ''}
          onChange={val => onChange('localidadActa', val)}
          options={localidadesFiltradas.length > 0 ? localidadesFiltradas : ['Selecciona municipio primero']}
        />

        <FormInput
          label="Fecha del Acta"
          type="date"
          value={datosEspecif.fechaActa}
          onChange={val => onChange('fechaActa', val)}
        />

        <FormInput
          label="Concepto del Apoyo"
          value={datosEspecif.conceptoApoyo}
          onChange={val => onChange('conceptoApoyo', val)}
          placeholder="Concepto técnico del apoyo"
        />

        <FormInput
          label="Nombre del Proveedor"
          value={datosEspecif.nombreProveedor}
          onChange={val => onChange('nombreProveedor', val)}
          placeholder="Nombre o Razón Social Proveedor"
        />

        <FormInput
          label="Representante de la Empresa"
          value={datosEspecif.representanteEmpresa}
          onChange={val => onChange('representanteEmpresa', val)}
          placeholder="Representante"
        />

        <FormInput
          label="Nombre del Supervisor Gubernamental"
          value={datosEspecif.nombreSupervisorGubernamental}
          onChange={val => onChange('nombreSupervisorGubernamental', val)}
          placeholder="Nombre del Supervisor"
        />

        <FormInput
          label="Variedad de Semilla Certificada de Frijol / Cultivo"
          value={datosEspecif.variedadSemillaCertificada}
          onChange={val => onChange('variedadSemillaCertificada', val)}
          placeholder="Ej. Pinto Saltillo, Negro Nayarit, Maíz Blanco"
          required
        />

        <FormInput
          label="Cantidad Autorizada (kg)"
          type="number"
          value={datosEspecif.cantidadAutorizadaKg}
          onChange={val => onChange('cantidadAutorizadaKg', val)}
          placeholder="Cantidad en kg"
          required
        />

        <FormInput
          label="Superficie Autorizada (ha)"
          type="number"
          value={datosEspecif.superficieAutorizadaHa}
          onChange={val => onChange('superficieAutorizadaHa', val)}
          placeholder="Superficie en ha"
          required
        />

        <FormInput
          label="Número de Bultos"
          type="number"
          value={datosEspecif.numeroBultos}
          onChange={val => onChange('numeroBultos', val)}
          placeholder="Cantidad de bultos"
        />

        <FormSelect
          label="Título de Propiedad / Acreditación"
          value={datosEspecif.tituloPropiedad}
          onChange={val => onChange('tituloPropiedad', val)}
          options={titulosPropiedad}
        />

        {datosEspecif.tituloPropiedad === 'Otro' && (
          <FormInput
            label="En Caso de Otro (Especificar)"
            value={datosEspecif.enCasoOtroEspecificar}
            onChange={val => onChange('enCasoOtroEspecificar', val)}
            placeholder="Especificar documento"
          />
        )}

        <FormInput
          label="Número de Documento / Folio"
          value={datosEspecif.numeroDocumento}
          onChange={val => onChange('numeroDocumento', val)}
          placeholder="Folio oficial"
        />
      </div>
    </div>
  );
}
