import React, { useState } from 'react';
import { Shield, Clock, LogIn, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { apiLogin, saveSession, clearSession } from '../services/api';

/**
 * Modal de expiración / advertencia de sesión.
 *
 * Se muestra en dos modos según el estado de la sesión:
 *
 *  'warning'  → Aviso anticipado: "Tu sesión expira en X minutos"
 *               Opciones: [Renovar sesión] [Cerrar sesión] [Ignorar]
 *
 *  'expired'  → Sesión ya expirada: "Tu sesión ha terminado"
 *               Opciones: [Renovar sesión] [Cerrar sesión]
 *
 * Para "Renovar sesión" se muestra un mini-formulario de contraseña
 * inline que reutiliza el username del usuario actual, sin salir de la app.
 *
 * @param {string} sessionState - 'warning' | 'expired'
 * @param {number} minutesLeft - Minutos restantes (para el modo warning)
 * @param {Object} currentUser - Usuario autenticado { username, name, role }
 * @param {Function} onRenewed - Callback al renovar sesión exitosamente (recibe el nuevo user)
 * @param {Function} onLogout - Callback al cerrar sesión definitivamente
 * @param {Function} onDismiss - Callback al ignorar el aviso (solo en modo warning)
 */
export default function SessionExpiryModal({
  sessionState,
  minutesLeft,
  currentUser,
  onRenewed,
  onLogout,
  onDismiss,
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRenewForm, setShowRenewForm] = useState(false);

  // No renderizar nada si la sesión está activa
  if (sessionState === 'active') return null;

  const isExpired = sessionState === 'expired';

  /**
   * Intenta renovar la sesión con la contraseña proporcionada.
   * Si el login es exitoso, actualiza el token en localStorage y notifica al padre.
   */
  const handleRenew = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(currentUser.username, password);
      // saveSession ya está integrado en apiLogin, así que aquí solo notificamos al padre
      setPassword('');
      setShowRenewForm(false);
      onRenewed(data.user);
    } catch (err) {
      setError(err.message || 'Contraseña incorrecta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay: cubre toda la pantalla, con mayor z-index para aparecer sobre todo
    // En modo 'expired' bloquea la interacción (no se puede cerrar con click fuera)
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Franja superior de color según el estado */}
        <div
          className="h-1.5 w-full"
          style={{
            background: isExpired
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #f59e0b, #d97706)',
          }}
        />

        {/* Botón cerrar — solo en modo warning y si el usuario eligió ignorar */}
        {!isExpired && onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            title="Ignorar aviso"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-8">
          {/* ── Icono y título ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: isExpired
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(245,158,11,0.15)',
                border: `2px solid ${isExpired ? '#ef4444' : '#f59e0b'}`,
              }}
            >
              {isExpired
                ? <Shield size={32} style={{ color: '#ef4444' }} />
                : <Clock size={32} style={{ color: '#f59e0b' }} />
              }
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {isExpired ? 'Sesión finalizada' : '⚠️ Sesión por expirar'}
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed">
              {isExpired
                ? `Hola ${currentUser?.name?.split(' ')[0] || 'usuario'}, tu sesión ha terminado por inactividad. Renueva tu sesión para continuar trabajando sin perder tu progreso.`
                : `Tu sesión expirará en ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}. Puedes renovarla ahora para continuar sin interrupciones.`
              }
            </p>
          </div>

          {/* ── Indicador de tiempo (solo en modo warning) ─────────────────── */}
          {!isExpired && (
            <div
              className="flex items-center gap-3 rounded-xl p-3 mb-6"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span className="text-xs text-amber-300">
                Después de este tiempo necesitarás ingresar tu contraseña nuevamente.
              </span>
            </div>
          )}

          {/* ── Formulario de renovación de sesión ─────────────────────────── */}
          {showRenewForm ? (
            <form onSubmit={handleRenew} className="mb-4">
              <div className="mb-3">
                {/* Campo de username (solo lectura, para contexto visual) */}
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2 text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <LogIn size={14} className="text-slate-400" />
                  <span className="text-slate-400">Usuario:</span>
                  <span className="text-white font-medium">{currentUser?.username}</span>
                </div>

                {/* Campo de contraseña */}
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Ingresa tu contraseña para renovar"
                  autoFocus
                  required
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                  }}
                />

                {/* Mensaje de error */}
                {error && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} /> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: loading || !password
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: loading || !password ? '#64748b' : 'white',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                }}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verificando...</>
                  : <><RefreshCw size={15} /> Renovar sesión</>
                }
              </button>

              {/* Volver a las opciones principales */}
              <button
                type="button"
                onClick={() => { setShowRenewForm(false); setError(''); setPassword(''); }}
                className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                ← Volver
              </button>
            </form>
          ) : (
            /* ── Botones de acción principales ─────────────────────────────── */
            <div className="flex flex-col gap-3">
              {/* Botón primario: Renovar sesión */}
              <button
                onClick={() => setShowRenewForm(true)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                }}
              >
                <RefreshCw size={15} />
                Renovar mi sesión
              </button>

              {/* Botón secundario: Cerrar sesión definitivamente */}
              <button
                onClick={onLogout}
                className="w-full py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-white border border-transparent hover:border-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={15} />
                Cerrar sesión
              </button>

              {/* Opción de ignorar (solo en modo warning) */}
              {!isExpired && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
                >
                  Ignorar por ahora
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
