import React from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function PasoGenerales({ formData, setFormData, catalogos, moduloTipo }) {
  const progInfo = catalogos.programasComponentes[moduloTipo] || { programa: '', componentes: [] };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Datos Generales de la Solicitud (Pág. 3 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Fecha de Registro"
          type="date"
          value={formData.fechaRegistro}
          onChange={val => setFormData({ ...formData, fechaRegistro: val })}
          required
        />

        <FormInput
          label="Fecha de la Solicitud"
          type="date"
          value={formData.fechaSolicitud}
          onChange={val => setFormData({ ...formData, fechaSolicitud: val })}
          required
        />

        <FormInput
          label="Programa Institucional"
          value={formData.programa || progInfo.programa}
          onChange={val => setFormData({ ...formData, programa: val })}
          disabled
          className="col-span-2 text-nayarit-green"
        />

        <FormSelect
          label="Componente Autorizado"
          value={formData.componente}
          onChange={val => setFormData({ ...formData, componente: val })}
          options={progInfo.componentes || []}
          required
          className="col-span-2"
        />

        <FormInput
          label="Folio Solicitud"
          value="Se generará automáticamente al guardar"
          disabled
          className="col-span-2"
        />
      </div>
    </div>
  );
}
