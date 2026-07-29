export const formatMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(val) || 0);
};

export const formatFecha = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const formatModulo = (mod) => {
  const map = {
    'AGRICULTURA_FRIJOL': 'Agricultura',
    'GANADERIA': 'Ganadería',
    'PESCA_ACUACULTURA': 'Pesca y Acuacultura',
    'INFRAESTRUCTURA': 'Infraestructura Rural',
    'MAQUINARIA': 'Centrales de Maquinaria',
    'MEDIOS': 'Información de Medios',
    'TEMAS_IMPORTANTES': 'Temas de Importancia'
  };
  return map[mod] || mod;
};
