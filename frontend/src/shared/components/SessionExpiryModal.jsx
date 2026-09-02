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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Franja superior institucional */}
        <div
          className={`h-1.5 w-full ${isExpired ? 'bg-rose-600' : 'bg-[#5E1232]'}`}
        />

        {/* Botón cerrar — solo en modo warning */}
        {!isExpired && onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="Ignorar aviso"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-6">
          {/* ── Icono y título ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border ${
                isExpired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isExpired ? <Shield size={24} /> : <Clock size={24} />}
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              {isExpired ? 'Sesión Finalizada' : 'Sesión por Expirar'}
            </h2>

            <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
              {isExpired
                ? `Hola ${currentUser?.name?.split(' ')[0] || 'usuario'}, tu sesión ha terminado por inactividad. Puedes renovarla para continuar trabajando sin perder tus cambios.`
                : `Tu sesión finalizará en ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}. Puedes renovarla ahora para continuar capturando sin interrupciones.`
              }
            </p>
          </div>

          {/* ── Indicador de tiempo (solo en modo warning) ─────────────────── */}
          {!isExpired && (
            <div className="flex items-center gap-2.5 rounded-lg p-3 mb-5 bg-amber-50 border border-amber-200 text-amber-900">
              <AlertTriangle size={16} className="text-amber-700 shrink-0" />
              <span className="text-[11px] font-medium">
                Al concluir el tiempo requerirás validar tu contraseña nuevamente.
              </span>
            </div>
          )}

          {/* ── Formulario de renovación de sesión ─────────────────────────── */}
          {showRenewForm ? (
            <form onSubmit={handleRenew} className="space-y-3">
              <div>
                {/* Campo de username (solo lectura) */}
                <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-50 border border-slate-200 text-xs mb-2">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <LogIn size={13} />
                    <span>Usuario:</span>
                  </div>
                  <span className="text-slate-900 font-bold">{currentUser?.username}</span>
                </div>

                {/* Campo de contraseña */}
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Ingresa tu contraseña"
                  autoFocus
                  required
                  className="w-full rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-white border border-slate-300 focus:border-[#5E1232] focus:ring-1 focus:ring-[#5E1232] outline-none transition-colors"
                />

                {/* Mensaje de error */}
                {error && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertTriangle size={13} /> {error}
                  </p>
                )}
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-2.5 bg-[#5E1232] hover:bg-[#4a0d26] disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>Renovar Sesión</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowRenewForm(false); setError(''); setPassword(''); }}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  ← Volver
                </button>
              </div>
            </form>
          ) : (
            /* ── Botones de acción principales ─────────────────────────────── */
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setShowRenewForm(true)}
                className="w-full py-2.5 bg-[#5E1232] hover:bg-[#4a0d26] text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Renovar Mi Sesión</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <LogIn size={14} />
                <span>Cerrar Sesión</span>
              </button>

              {!isExpired && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors py-1 cursor-pointer"
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

