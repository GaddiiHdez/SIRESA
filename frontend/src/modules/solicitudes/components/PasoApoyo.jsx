import React from 'react';
import FormInput from '../../../shared/components/FormInput';
import FormSelect from '../../../shared/components/FormSelect';

export default function PasoApoyo({ apoyoControl, onChange, catalogos }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
        Datos del Apoyo y Control (Pág. 5 del PDF)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FormInput
          label="Concepto de Apoyo"
          value={apoyoControl.conceptoApoyo}
          onChange={val => onChange('conceptoApoyo', val)}
          placeholder="Ej. Adquisición de Semilla Certificada"
          required
        />

        <FormInput
          label="Unidad de Medida"
          value={apoyoControl.unidadMedida}
          onChange={val => onChange('unidadMedida', val)}
          placeholder="Ej. Kilogramos, Hectáreas, Cabezas"
          required
        />

        <FormInput
          label="Cantidad"
          type="number"
          value={apoyoControl.cantidad}
          onChange={val => onChange('cantidad', val)}
          placeholder="Cantidad"
          required
        />

        <FormInput
          label="Superficie Terreno (ha)"
          type="number"
          value={apoyoControl.superficie}
          onChange={val => onChange('superficie', val)}
          placeholder="Superficie en hectáreas"
        />

        <FormSelect
          label="Tenencia de la Tierra"
          value={apoyoControl.tenenciaTierra}
          onChange={val => onChange('tenenciaTierra', val)}
          options={catalogos.tenenciasTierra}
          required
        />

        <FormSelect
          label="Grado de Marginación"
          value={apoyoControl.gradoMarginacion}
          onChange={val => onChange('gradoMarginacion', val)}
          options={catalogos.gradosMarginacion}
          required
        />

        <FormInput
          label="Especificación del Apoyo"
          value={apoyoControl.especificacionApoyo}
          onChange={val => onChange('especificacionApoyo', val)}
          placeholder="Marca, modelo, etc."
          className="col-span-2"
        />

        <FormSelect
          label="Priorización"
          value={apoyoControl.priorizacion}
          onChange={val => onChange('priorizacion', val)}
          options={catalogos.priorizaciones}
          required
        />

        <FormInput
          label="Monto Total ($)"
          type="number"
          value={apoyoControl.montoTotal}
          onChange={val => onChange('montoTotal', val)}
          placeholder="Monto Total"
          required
        />

        <FormInput
          label="Aportación Programa ($)"
          type="number"
          value={apoyoControl.aportacionPrograma}
          onChange={val => onChange('aportacionPrograma', val)}
          placeholder="Aportación Programa"
        />

        <FormInput
          label="Aportación Solicitante ($)"
          type="number"
          value={apoyoControl.aportacionSolicitante}
          onChange={val => onChange('aportacionSolicitante', val)}
          placeholder="Aportación Solicitante"
        />

        <FormInput
          label="Aportación Estatal ($)"
          type="number"
          value={apoyoControl.aportacionEstatal}
          onChange={val => onChange('aportacionEstatal', val)}
          placeholder="Aportación Estatal"
        />

        <FormInput
          label="Aportación Federal ($)"
          type="number"
          value={apoyoControl.aportacionFederal}
          onChange={val => onChange('aportacionFederal', val)}
          placeholder="Aportación Federal"
        />

        <FormSelect
          label="Trimestre"
          value={apoyoControl.trimestre}
          onChange={val => onChange('trimestre', val)}
          options={catalogos.trimestres}
          required
        />

        {/* Sección administrativa de control financiero del PDF */}
        <div className="col-span-3 border-t border-slate-100 pt-5 mt-2 space-y-4">
          <h4 className="text-slate-600 font-bold text-xs uppercase tracking-wider">
            Control Administrativo y Dictaminación
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormSelect
              label="Dictamen"
              value={apoyoControl.dictamen}
              onChange={val => onChange('dictamen', val)}
              options={catalogos.dictamenes}
            />

            <FormInput
              label="Comentario del Dictamen"
              value={apoyoControl.comentarioDictamen}
              onChange={val => onChange('comentarioDictamen', val)}
              placeholder="Detalles del dictamen"
            />

            <FormInput
              label="Sesión del OD"
              value={apoyoControl.sesionOd}
              onChange={val => onChange('sesionOd', val)}
              placeholder="Ej. Sesión Ordinaria 01"
            />

            <FormInput
              label="Fecha de la Sesión OD"
              type="date"
              value={apoyoControl.fechaSesionOd}
              onChange={val => onChange('fechaSesionOd', val)}
            />

            <FormInput
              label="Factura"
              value={apoyoControl.factura}
              onChange={val => onChange('factura', val)}
              placeholder="Folio de Factura"
            />

            <FormInput
              label="Proveedor"
              value={apoyoControl.proveedor}
              onChange={val => onChange('proveedor', val)}
              placeholder="Razón Social Proveedor"
            />

            <FormInput
              label="RFC Proveedor"
              value={apoyoControl.rfcProveedor}
              onChange={val => onChange('rfcProveedor', val)}
              placeholder="RFC Proveedor"
            />

            <FormInput
              label="Monto Pagado ($)"
              type="number"
              value={apoyoControl.montoPagado}
              onChange={val => onChange('montoPagado', val)}
              placeholder="Monto Pagado"
            />

            <FormInput
              label="Economía ($)"
              type="number"
              value={apoyoControl.economia}
              onChange={val => onChange('economia', val)}
              placeholder="Ahorros o Economía"
            />

            <FormInput
              label="Fecha de Pago"
              type="date"
              value={apoyoControl.fechaPago}
              onChange={val => onChange('fechaPago', val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
