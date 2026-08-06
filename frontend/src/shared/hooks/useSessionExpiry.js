import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken, clearSession } from '../services/api';
import { toast } from '../utils/toast';

// Minutos antes de que expire el token en que se muestra el aviso
const WARN_BEFORE_MINUTES = 10;

/**
 * Decodifica el payload de un JWT sin necesidad de la clave secreta.
 * Los JWTs son base64url-encoded, por lo que se pueden leer en el cliente
 * para extraer datos como la fecha de expiración (exp).
 *
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decodificado o null si el token es inválido
 */
function decodeJwtPayload(token) {
  try {
    // El JWT tiene 3 partes separadas por ".": header.payload.signature
    const base64Payload = token.split('.')[1];
    // base64url usa "-" y "_" en lugar de "+" y "/"; se normaliza antes de decodificar
    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

/**
 * Hook que gestiona la expiración de sesión de forma proactiva.
 *
 * Comportamiento:
 *  1. Al montar, lee el token del localStorage y decodifica su fecha de expiración
 *  2. Si el token ya expiró → activa estado de sesión expirada inmediatamente
 *  3. Si expira en menos de WARN_BEFORE_MINUTES → activa el aviso inmediatamente
 *  4. Si faltan más de WARN_BEFORE_MINUTES → programa un timer para mostrar el aviso
 *  5. Cuando llega la hora de expiración → activa el estado de sesión expirada
 *
 * @param {Function} onExpired - Callback que se ejecuta al confirmar logout por expiración
 * @returns {{ sessionState, minutesLeft, dismissWarning }}
 *   - sessionState: 'active' | 'warning' | 'expired'
 *   - minutesLeft: minutos restantes (solo relevante en estado 'warning')
 *   - dismissWarning: función para cerrar el aviso (el usuario ya inició sesión de nuevo)
 */
export function useSessionExpiry(onExpired) {
  // Estado de la sesión: 'active' = normal, 'warning' = pronto expira, 'expired' = ya expiró
  const [sessionState, setSessionState] = useState('active');
  const [minutesLeft, setMinutesLeft] = useState(WARN_BEFORE_MINUTES);

  // Refs para limpiar timers si el componente se desmonta
  const warnTimerRef = useRef(null);
  const expireTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Función para limpiar todos los timers activos
  const clearAllTimers = useCallback(() => {
    clearTimeout(warnTimerRef.current);
    clearTimeout(expireTimerRef.current);
    clearInterval(countdownIntervalRef.current);
  }, []);

  // Iniciar la cuenta regresiva visible en el modal de advertencia
  const startCountdown = useCallback((secondsLeft) => {
    setMinutesLeft(Math.ceil(secondsLeft / 60));

    countdownIntervalRef.current = setInterval(() => {
      setMinutesLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return next;
      });
    }, 60000); // Actualizar cada minuto
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return; // Sin token, no hay nada que monitorear

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return; // Token malformado

    const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos (Unix timestamp)
    const expiresAt = payload.exp;              // Tiempo de expiración en segundos
    const secondsLeft = expiresAt - now;        // Segundos restantes

    // ── Caso 1: El token ya expiró ─────────────────────────────────────────
    if (secondsLeft <= 0) {
      setSessionState('expired');
      return;
    }

    const warnThreshold = WARN_BEFORE_MINUTES * 60; // Umbral de aviso en segundos

    // ── Caso 2: El token expira en menos del tiempo de aviso ───────────────
    if (secondsLeft <= warnThreshold) {
      setSessionState('warning');
      startCountdown(secondsLeft);

      // Timer para cuando expire definitivamente
      expireTimerRef.current = setTimeout(() => {
        setSessionState('expired');
        clearInterval(countdownIntervalRef.current);
      }, secondsLeft * 1000);

      return;
    }

    // ── Caso 3: El token tiene tiempo suficiente — programar timers ─────────
    const msUntilWarn = (secondsLeft - warnThreshold) * 1000;
    const msUntilExpire = secondsLeft * 1000;

    // Timer: mostrar aviso 10 minutos antes de expirar
    warnTimerRef.current = setTimeout(() => {
      setSessionState('warning');
      startCountdown(warnThreshold);

      // Toast visible aunque el usuario no esté mirando el modal
      toast.warning(
        '⚠️ Tu sesión expirará en 10 minutos. Guarda tu trabajo y renueva la sesión.',
        8000
      );
    }, msUntilWarn);

    // Timer: marcar como expirado cuando llegue la hora
    expireTimerRef.current = setTimeout(() => {
      setSessionState('expired');
      clearInterval(countdownIntervalRef.current);
    }, msUntilExpire);

    // Limpiar timers si el componente se desmonta (logout manual, navegación, etc.)
    return () => clearAllTimers();
  }, [startCountdown, clearAllTimers]);

  // Función para cerrar el aviso manualmente (el usuario decidió ignorarlo)
  const dismissWarning = useCallback(() => {
    setSessionState('active');
    clearAllTimers();
  }, [clearAllTimers]);

  return { sessionState, minutesLeft, dismissWarning };
}
