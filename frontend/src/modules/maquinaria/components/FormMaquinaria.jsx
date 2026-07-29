import React from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormCheckbox from '../../../shared/components/FormCheckbox';

export default function FormMaquinaria({ datosEspecif, onChange }) {
  const handleCheckboxChange = (field, checked) => {
    onChange(field, checked ? 'SI' : null);
  };

  const checkboxes = [
    { field: 'tractor', label: 'Tractor Agrícola (TRACTOR)' },
    { field: 'rastra', label: 'Rastra (RASTRA)' },
    { field: 'sc', label: 'Subsuelo (SC)' },
    { field: 'sp', label: 'Sembradora (SP)' },
    { field: 'rf', label: 'RF' },
    { field: 'rg', label: 'RG' },
    { field: 'en', label: 'EN' },
    { field: 'em', label: 'EM' },
    { field: 'cribadora', label: 'Cribadora' },
    { field: 'b', label: 'B' },
    { field: 'mf', label: 'MF' },
    { field: 'cg', label: 'CG' },
    { field: 'niv', label: 'Niveladora (NIV)' },
    { field: 'pps', label: 'PPS' },
    { field: 'transporte', label: 'Transporte' },
    { field: 'otro', label: 'Otro Implemento' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Datos de Centrales de Maquinaria (Pág. 10 del PDF)
      </h3>
      
      <div className="space-y-3">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Maquinaria / Implementos Solicitados
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {checkboxes.map(cb => (
            <FormCheckbox
              key={cb.field}
              label={cb.label}
              checked={datosEspecif[cb.field] === 'SI'}
              onChange={checked => handleCheckboxChange(cb.field, checked)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
        <FormInput
          label="Fecha Solicitada para el Apoyo"
          type="date"
          value={datosEspecif.fechaSolicitada}
          onChange={val => onChange('fechaSolicitada', val)}
        />

        <FormInput
          label="Rama Productiva"
          value={datosEspecif.ramaProductiva}
          onChange={val => onChange('ramaProductiva', val)}
          placeholder="Ej. Cultivo de Frijol"
        />

        <FormInput
          label="Plazo Solicitado (Días/Horas)"
          value={datosEspecif.plazoSolicitado}
          onChange={val => onChange('plazoSolicitado', val)}
          placeholder="Ej. 15 días"
        />

        <FormInput
          label="Nombre del Contacto"
          value={datosEspecif.nombreContacto}
          onChange={val => onChange('nombreContacto', val)}
          placeholder="Nombre del operario o encargado"
          required
        />

        <FormInput
          label="Teléfono del Contacto"
          value={datosEspecif.telefonoContacto}
          onChange={val => onChange('telefonoContacto', val)}
          placeholder="10 dígitos"
          required
        />

        <FormInput
          label="Fecha 1 Tentativa de Uso"
          type="date"
          value={datosEspecif.fecha1}
          onChange={val => onChange('fecha1', val)}
        />

        <FormInput
          label="Fecha 2 Tentativa de Uso"
          type="date"
          value={datosEspecif.fecha2}
          onChange={val => onChange('fecha2', val)}
        />
      </div>
    </div>
  );
}
