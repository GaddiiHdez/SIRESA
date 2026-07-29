import { Wheat, Beef, Fish, Building2, Tractor, Megaphone, AlertCircle, HelpCircle } from 'lucide-react';

export const SECTORES = [
  { id: 'AGRICULTURA_FRIJOL', name: 'Agricultura', desc: 'Cultivos y siembras agrícolas', Icon: Wheat, flow: [1, 2, 3, 4, 5] },
  { id: 'GANADERIA', name: 'Ganadería', desc: 'Pecuario, predios e inventarios', Icon: Beef, flow: [1, 2, 3, 4, 5] },
  { id: 'PESCA_ACUACULTURA', name: 'Pesca y Acuacultura', desc: 'Unidades acuícolas y pesca', Icon: Fish, flow: [1, 2, 3, 4, 5] },
  { id: 'INFRAESTRUCTURA', name: 'Infraestructura Rural', desc: 'Distritos de riego y obras', Icon: Building2, flow: [1, 2, 4, 5] },
  { id: 'MAQUINARIA', name: 'Centrales de Maquinaria', desc: 'Equipo pesado y tractores', Icon: Tractor, flow: [1, 2, 4, 5] },
  { id: 'MEDIOS', name: 'Información para Medios', desc: 'Boletines de prensa y notas', Icon: Megaphone, flow: [4] },
  { id: 'TEMAS_IMPORTANTES', name: 'Temas Importantes', desc: 'Alertas e incidencias de SEDER', Icon: AlertCircle, flow: [4] }
];

export const getFlowSteps = (tipo) => {
  const sector = SECTORES.find(s => s.id === tipo);
  return sector ? sector.flow : [];
};

export const getSectorIcon = (tipo) => {
  const sector = SECTORES.find(s => s.id === tipo);
  return sector ? sector.Icon : HelpCircle;
};
