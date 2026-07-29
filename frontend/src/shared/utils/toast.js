// Utilidad para lanzar notificaciones tipo Toast a través de eventos personalizados.
export const toast = {
  show: (message, type = 'info', duration = 4000) => {
    window.dispatchEvent(
      new CustomEvent('sdr-toast', {
        detail: { id: Math.random().toString(36).substr(2, 9), message, type, duration }
      })
    );
  },
  success: (message, duration) => toast.show(message, 'success', duration),
  error: (message, duration) => toast.show(message, 'error', duration),
  warning: (message, duration) => toast.show(message, 'warning', duration),
  info: (message, duration) => toast.show(message, 'info', duration),
};
