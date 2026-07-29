import React from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function FormTemasImportantes({ datosEspecif, onChange, catalogos }) {
  const tipos = [
    'Problemática',
    'Programa Emergente',
    'Otro'
  ];

  const areasSeder = [
    'Ganadería',
    'Agricultura',
    'Pesca y Acuacultura',
    'Desarrollo Rural'
  ];

  const autoridades = [
    'SADER',
    'SENASICA',
    'COMITÉS',
    'SECRETARÍAS DE GOBIERNO'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Temas Importantes (Pág. 13 del PDF)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Fecha del Reporte / Suceso"
          type="date"
          value={datosEspecif.fecha}
          onChange={val => onChange('fecha', val)}
          required
        />

        <FormSelect
          label="Tipo"
          value={datosEspecif.tipo}
          onChange={val => onChange('tipo', val)}
          options={tipos}
          required
        />

        <FormInput
          label="Descripción"
          value={datosEspecif.descripcion}
          onChange={val => onChange('descripcion', val)}
          placeholder="Descripción sucinta"
          required
        />

        <FormSelect
          label="Área que interviene en SEDER"
          value={datosEspecif.areaSeder}
          onChange={val => onChange('areaSeder', val)}
          options={areasSeder}
          required
        />

        <FormSelect
          label="¿Quiénes intervienen para atenderlo?"
          value={datosEspecif.quienesIntervienen}
          onChange={val => onChange('quienesIntervienen', val)}
          options={autoridades}
          required
        />

        <div className="space-y-1.5 col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            ¿Cómo se está atendiendo? (Como está interviniendo la SEDER) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={datosEspecif.comoSeAtiende || ''}
            onChange={e => onChange('comoSeAtiende', e.target.value)}
            placeholder="Escribe la intervención del gobierno..."
            className="w-full px-3.5 py-3 glass-input rounded-xl text-slate-800 text-sm h-20 focus:outline-none focus:border-nayarit-gold bg-white font-semibold"
            required
          />
        </div>

        <FormInput
          label="¿Cuánta inversión se tiene?"
          value={datosEspecif.inversion}
          onChange={val => onChange('inversion', val)}
          placeholder="Monto de inversión"
        />

        <FormInput
          label="¿Cómo se distribuye?"
          value={datosEspecif.distribucion}
          onChange={val => onChange('distribucion', val)}
          placeholder="Distribución del capital"
        />

        <FormInput
          label="¿Cuántos productores se han apoyado?"
          value={datosEspecif.productoresApoyados}
          onChange={val => onChange('productoresApoyados', val)}
          placeholder="Número de productores"
        />

        <FormInput
          label="¿Cuántas hectáreas o unidades productivas se han apoyado?"
          value={datosEspecif.hectareasApoyadas}
          onChange={val => onChange('hectareasApoyadas', val)}
          placeholder="Hectáreas o Unidades"
        />

        <FormInput
          label="¿Cuánto es el beneficio o el ahorro para el productor?"
          value={datosEspecif.beneficioAhorro}
          onChange={val => onChange('beneficioAhorro', val)}
          placeholder="Ahorro estimado"
        />

        <FormSelect
          label="Municipio Apoyado / Atendido"
          value={datosEspecif.municipiosApoyados || ''}
          onChange={val => onChange('municipiosApoyados', val)}
          options={['Selecciona municipio', ...(catalogos?.municipios || [])]}
        />

        <div className="space-y-1.5 col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Reporte / Resumen <span className="text-red-500">*</span>
          </label>
          <textarea
            value={datosEspecif.reporteResumen || ''}
            onChange={e => onChange('reporteResumen', e.target.value)}
            placeholder="Resumen del reporte..."
            className="w-full px-3.5 py-3 glass-input rounded-xl text-slate-800 text-sm h-24 focus:outline-none focus:border-nayarit-gold bg-white font-semibold"
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
