import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-50/95 backdrop-blur-md',
    border: 'border-emerald-250/80 shadow-emerald-100/10',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-500',
    Icon: CheckCircle2
  },
  error: {
    bg: 'bg-red-50/95 backdrop-blur-md',
    border: 'border-red-200/80 shadow-red-100/10',
    text: 'text-red-800',
    iconColor: 'text-red-500',
    Icon: AlertCircle
  },
  warning: {
    bg: 'bg-amber-50/95 backdrop-blur-md',
    border: 'border-amber-200/80 shadow-amber-100/10',
    text: 'text-amber-800',
    iconColor: 'text-amber-500',
    Icon: AlertTriangle
  },
  info: {
    bg: 'bg-blue-50/95 backdrop-blur-md',
    border: 'border-blue-200/80 shadow-blue-100/10',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
    Icon: Info
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { id, message, type, duration } = e.detail;
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Programar auto-eliminación
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    window.addEventListener('sdr-toast', handleToast);
    return () => {
      window.removeEventListener('sdr-toast', handleToast);
    };
  }, []);

  const handleDismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <style>{`
        @keyframes toast-slide-down {
          0% {
            transform: translateY(-1rem) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-toast {
          animation: toast-slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const ToastIcon = style.Icon;

          return (
            <div
              key={toast.id}
              className={`animate-toast pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${style.bg} ${style.border} ${style.text} shadow-lg transition-all duration-300 font-sans`}
            >
              <ToastIcon className={`w-5 h-5 shrink-0 ${style.iconColor} mt-0.5`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-normal break-words">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => handleDismiss(toast.id)}
                className="p-0.5 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-650 transition-smooth shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
