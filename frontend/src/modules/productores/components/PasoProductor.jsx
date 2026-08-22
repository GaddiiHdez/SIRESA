import React, { useState, useEffect } from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';
import { apiBuscarProductor } from '../../../shared/services/api';
import { CheckCircle2, AlertTriangle, UserCheck, Sparkles } from 'lucide-react';

export default function PasoProductor({ productor, onChange, catalogos, localidadesFiltradas, isColectivoOnly = false }) {
  const isFisica = productor.tipoPersona === 'FISICA';
  const [existingProductor, setExistingProductor] = useState(null);
  const [checkingCurp, setCheckingCurp] = useState(false);

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

  // Consultar unicidad de CURP / RFC en tiempo real cuando se alcancen los caracteres completos
  useEffect(() => {
    const targetQuery = isFisica ? productor.curp : productor.rfc;
    if (!targetQuery) {
      setExistingProductor(null);
      return;
    }

    const clean = targetQuery.trim().toUpperCase();
    const isValidLength = isFisica ? clean.length === 18 : clean.length >= 12;

    if (isValidLength) {
      const timer = setTimeout(async () => {
        setCheckingCurp(true);
        try {
          const res = await apiBuscarProductor(clean);
          if (res.existe && res.productor) {
            setExistingProductor(res.productor);
            // Autocompletar datos automáticamente
            const p = res.productor;
            if (isFisica) {
              onChange('nombre', p.nombre || productor.nombre);
              onChange('apellidoPaterno', p.apellidoPaterno || productor.apellidoPaterno);
              onChange('apellidoMaterno', p.apellidoMaterno || productor.apellidoMaterno);
            } else {
              onChange('nombreOrganizacion', p.nombreOrganizacion || productor.nombreOrganizacion);
              onChange('representante', p.representante || productor.representante);
            }
            onChange('domicilio', p.domicilio || productor.domicilio);
            onChange('telefono', p.telefono || productor.telefono);
            onChange('municipio', p.municipio || productor.municipio);
            onChange('localidad', p.localidad || productor.localidad);
            if (p.genero) onChange('genero', p.genero);
          } else {
            setExistingProductor(null);
          }
        } catch (err) {
          console.error('Error al verificar CURP/RFC:', err);
        } finally {
          setCheckingCurp(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setExistingProductor(null);
    }
  }, [productor.curp, productor.rfc, productor.tipoPersona]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider">
          Datos del Productor / Beneficiario (Pág. 4 del PDF)
        </h3>
        {checkingCurp && (
          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5 animate-pulse">
            <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            Verificando CURP / RFC...
          </span>
        )}
      </div>

      {/* BANNER DE PRODUCTOR EXISTENTE EN EL PADRÓN */}
      {existingProductor && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-extrabold text-emerald-900 flex items-center gap-2">
              Productor Registrado en el Padrón Institucional
              <span className="bg-emerald-200/80 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {existingProductor.solicitudes?.length || 1} Expedientes Históricos
              </span>
            </div>
            <p className="text-emerald-700 mt-1">
              Se han autocompletado los datos del ciudadano{' '}
              <strong className="font-bold">
                {existingProductor.nombreOrganizacion || `${existingProductor.nombre} ${existingProductor.apellidoPaterno || ''}`}
              </strong>
              . Esta solicitud se vinculará automáticamente a su expediente único para evitar duplicidades.
            </p>
          </div>
        </div>
      )}

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
              label="CURP (18 dígitos)"
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
          </>
        ) : (
          <>
            <FormInput
              label="RFC Organización"
              value={productor.rfc}
              onChange={val => onChange('rfc', val.toUpperCase())}
              placeholder="RFC (12 dígitos)"
              required
            />
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
          </>
        )}

        <FormSelect
          label="Municipio"
          value={productor.municipio}
          onChange={val => onChange('municipio', val)}
          options={catalogos.municipios || []}
          required
        />

        <FormSelect
          label="Localidad"
          value={productor.localidad}
          onChange={val => onChange('localidad', val)}
          options={localidadesFiltradas || []}
          required
        />

        <FormInput
          label="Domicilio"
          value={productor.domicilio}
          onChange={val => onChange('domicilio', val)}
          placeholder="Calle, Número, Colonia"
          required
        />

        <FormInput
          label="Teléfono de Contacto"
          value={productor.telefono}
          onChange={val => onChange('telefono', val)}
          placeholder="10 dígitos"
        />

        {isFisica && (
          <FormSelect
            label="Género"
            value={productor.genero}
            onChange={val => onChange('genero', val)}
            options={['Hombre', 'Mujer', 'Otro']}
          />
        )}
      </div>
    </div>
  );
}
