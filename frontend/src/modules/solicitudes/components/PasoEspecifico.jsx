import React from 'react';
import FormGanaderia from '../../ganaderia/components/FormGanaderia';
import FormAgriculturaFrijol from '../../agricultura/components/FormAgriculturaFrijol';
import FormPescaAcuacultura from '../../pesca/components/FormPescaAcuacultura';
import FormMaquinaria from '../../maquinaria/components/FormMaquinaria';
import FormInfraestructura from '../../infraestructura/components/FormInfraestructura';
import FormMedios from '../../medios/components/FormMedios';
import FormTemasImportantes from '../../contingencias/components/FormTemasImportantes';

export default function PasoEspecifico({ moduloTipo, datosEspecif, onChange, catalogos }) {
  switch (moduloTipo) {
    case 'GANADERIA':
      return <FormGanaderia datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    case 'AGRICULTURA_FRIJOL':
      return <FormAgriculturaFrijol datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    case 'PESCA_ACUACULTURA':
      return <FormPescaAcuacultura datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    case 'MAQUINARIA':
      return <FormMaquinaria datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    case 'INFRAESTRUCTURA':
      return <FormInfraestructura datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    case 'MEDIOS':
      return <FormMedios datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    case 'TEMAS_IMPORTANTES':
      return <FormTemasImportantes datosEspecif={datosEspecif} onChange={onChange} catalogos={catalogos} />;
    default:
      return (
        <p className="text-slate-500 text-sm font-medium py-10 text-center">
          Este sector no requiere datos específicos adicionales.
        </p>
      );
  }
}
