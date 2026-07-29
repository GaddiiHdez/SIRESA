import React from 'react';
import { Upload, CheckCircle, AlertCircle, UserCheck, FileBadge, FileText, MapPin, DollarSign } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';

export default function PasoDocumentos({ documentosCargados, docProgress, onUpload }) {
  const [activeKey, setActiveKey] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const docsList = [
    { key: 'ine', label: 'Identificación Oficial Vigente (INE / Pasaporte)', icon: UserCheck },
    { key: 'curp', label: 'CURP del Solicitante o Representante', icon: FileBadge },
    { key: 'rfc', label: 'Cédula de Identificación Fiscal (RFC / CSF)', icon: FileText },
    { key: 'comprobante', label: 'Comprobante de Domicilio Pecuario/Agrícola', icon: MapPin },
    { key: 'factura', label: 'Factura proforma o cotización del bien solicitado', icon: DollarSign }
  ];

  const handleButtonClick = (key) => {
    setActiveKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !activeKey) return;
    
    // Validar tamaño de archivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("El archivo supera el límite permitido de 5MB.");
      return;
    }

    onUpload(activeKey, file);
    e.target.value = ''; // Reiniciar input
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Input de archivo único y oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
        <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider">
          Carga de Documentación Física Digitalizada
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Formatos aceptados: PDF, JPG, PNG (máx 5MB)</span>
      </div>

      <div className="space-y-4">
        {docsList.map(doc => {
          const fileUrl = documentosCargados[doc.key];
          const isUploaded = !!fileUrl;
          const progress = docProgress[doc.key] || 0;
          const isUploading = progress > 0 && progress < 100;
          const DocIcon = doc.icon;

          return (
            <div key={doc.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-200/80 bg-white rounded-2xl transition-smooth hover:border-slate-350 hover:shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 shrink-0 mt-0.5">
                  <DocIcon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-800 text-sm md:text-[15px] font-bold block leading-snug">{doc.label}</span>
                  {isUploaded ? (
                    <a
                      href={`http://localhost:5000${fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-nayarit-gold hover:underline font-bold block mt-0.5"
                    >
                      Ver archivo cargado
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 block">Requisito obligatorio para la dictaminación de procedencia.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                {/* Indicador de Estado */}
                {isUploaded ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-[10px] font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Cargado
                  </span>
                ) : isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-nayarit-gold rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">{progress}%</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[10px] font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pendiente
                  </span>
                )}

                {/* Botón de Carga */}
                <button
                  type="button"
                  onClick={() => handleButtonClick(doc.key)}
                  disabled={isUploading}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-smooth border ${
                    isUploading
                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-nayarit-gold hover:text-nayarit-gold text-slate-600 shadow-sm cursor-pointer'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploaded ? 'Reemplazar' : isUploading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
