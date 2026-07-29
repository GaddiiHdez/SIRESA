import React from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function PasoProductor({ productor, onChange, catalogos, localidadesFiltradas, isColectivoOnly = false }) {
  const isFisica = productor.tipoPersona === 'FISICA';

  const tipoPersonaOptions = isColectivoOnly
    ? [
        { value: 'MORAL', label: 'Moral' },
        { value: 'GRUPO', label: 'Grupo' }
      ]
    : [
        { value: 'FISICA', label: 'Física' },
        { value: 'MORAL', label: 'Moral' },
        { value: 'GRUPO', label: 'Grupo' }
      ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Datos del Productor / Beneficiario (Pág. 4 del PDF)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FormSelect
          label="Tipo de Persona"
          value={productor.tipoPersona}
          onChange={val => onChange('tipoPersona', val)}
          options={tipoPersonaOptions}
          required
        />

        {isFisica ? (
          <>
            <FormInput
              label="Nombre(s)"
              value={productor.nombre}
              onChange={val => onChange('nombre', val)}
              placeholder="Nombres"
              required
            />
            <FormInput
              label="Apellido Paterno"
              value={productor.apellidoPaterno}
              onChange={val => onChange('apellidoPaterno', val)}
              placeholder="Apellido Paterno"
              required
            />
            <FormInput
              label="Apellido Materno"
              value={productor.apellidoMaterno}
              onChange={val => onChange('apellidoMaterno', val)}
              placeholder="Apellido Materno"
            />
            <FormInput
              label="CURP"
              value={productor.curp}
              onChange={val => onChange('curp', val.toUpperCase())}
              placeholder="CURP (18 dígitos)"
              required
            />
            <FormInput
              label="RFC"
              value={productor.rfc}
              onChange={val => onChange('rfc', val.toUpperCase())}
              placeholder="RFC (13 dígitos)"
            />
          </>
        ) : (
          <>
            <FormInput
              label="Nombre de la Organización"
              value={productor.nombreOrganizacion}
              onChange={val => onChange('nombreOrganizacion', val)}
              placeholder="Razón Social / Organización"
              required
              className="col-span-2"
            />
            <FormInput
              label="Representante Legal"
              value={productor.representante}
              onChange={val => onChange('representante', val)}
              placeholder="Representante"
              required
              className="col-span-2"
            />
            <FormInput
              label="RFC Organización"
              value={productor.rfc}
              onChange={val => onChange('rfc', val.toUpperCase())}
              placeholder="RFC (12 dígitos)"
              required
            />
          </>
        )}

        <FormSelect
          label="Municipio"
          value={productor.municipio}
          onChange={val => onChange('municipio', val)}
          options={['Selecciona municipio', ...catalogos.municipios]}
          required
        />

        <FormSelect
          label="Localidad"
          value={productor.localidad}
          onChange={val => onChange('localidad', val)}
          options={localidadesFiltradas.length > 0 ? localidadesFiltradas : ['Selecciona municipio primero']}
          required
        />

        <FormInput
          label="Domicilio Completo"
          value={productor.domicilio}
          onChange={val => onChange('domicilio', val)}
          placeholder="Calle, Número, Colonia, C.P."
          required
          className="col-span-2"
        />

        <FormInput
          label="Teléfono"
          value={productor.telefono}
          onChange={val => onChange('telefono', val)}
          placeholder="10 dígitos"
          required
        />

        <FormSelect
          label="Género"
          value={productor.genero || 'Hombre'}
          onChange={val => onChange('genero', val)}
          options={catalogos.generos}
          required
        />

        <FormSelect
          label="¿Es Indígena?"
          value={productor.indigena || 'NO'}
          onChange={val => onChange('indigena', val)}
          options={[
            { value: 'NO', label: 'No' },
            { value: 'SI', label: 'Sí' }
          ]}
          required
        />

        {productor.indigena === 'SI' && (
          <FormSelect
            label="Etnia Indígena"
            value={productor.etnia}
            onChange={val => onChange('etnia', val)}
            options={['Selecciona Etnia', ...catalogos.etnias]}
            required
          />
        )}

        <FormSelect
          label="¿Tiene Discapacidad?"
          value={productor.discapacidad || 'NO'}
          onChange={val => onChange('discapacidad', val)}
          options={[
            { value: 'NO', label: 'No' },
            { value: 'SI', label: 'Sí' }
          ]}
          required
        />

        {productor.discapacidad === 'SI' && (
          <FormSelect
            label="Tipo de Discapacidad"
            value={productor.tipoDiscapacidad}
            onChange={val => onChange('tipoDiscapacidad', val)}
            options={['Selecciona Tipo', ...catalogos.tiposDiscapacidad]}
            required
          />
        )}

        <FormInput
          label="Beneficiarios Hombres"
          type="number"
          value={productor.beneficiariosHombres}
          onChange={val => onChange('beneficiariosHombres', val)}
          placeholder="Cantidad de hombres"
        />

        <FormInput
          label="Beneficiarios Mujeres"
          type="number"
          value={productor.beneficiariosMujeres}
          onChange={val => onChange('beneficiariosMujeres', val)}
          placeholder="Cantidad de mujeres"
        />

        <FormSelect
          label="Tipo Identificación"
          value={productor.tipoIdentificacion || 'INE'}
          onChange={val => onChange('tipoIdentificacion', val)}
          options={catalogos.tiposIdentificacion}
          required
        />

        <FormInput
          label="Folio Identificación"
          value={productor.folioIdentificacion}
          onChange={val => onChange('folioIdentificacion', val)}
          placeholder="Folio de ID"
          required
        />
      </div>
    </div>
  );
}
