import React, { useState } from 'react';
import { apiLogin } from '../../../shared/services/api';
import { Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import pkg from '../../../../package.json';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(username, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Luces decorativas ambientales de fondo */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-nayarit-gold/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#5E1232]/10 blur-[130px] pointer-events-none" />

      {/* Tarjeta Principal Dividida (Split Screen Card) */}
      <div className="w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 z-10 relative animate-fadeIn">
        
        {/* COLUMNA IZQUIERDA: Identidad Institucional (Guinda & Dorado) */}
        <div className="md:col-span-5 bg-gradient-to-b from-[#5E1232] via-[#480c25] to-[#200210] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Adorno dorado superior */}
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-nayarit-gold via-yellow-400 to-nayarit-lightGreen" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-nayarit-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Bloque Superior: Logo Institucional */}
          <div className="space-y-6 relative z-10">
            <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-white/20 inline-block max-w-[240px]">
              <img 
                src="/logo-sdr.png" 
                alt="Secretaría de Desarrollo Rural Nayarit" 
                className="w-full h-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-nayarit-gold/25 text-nayarit-lightGold px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-nayarit-gold/30 inline-block">
                  Portal Institucional
                </span>
                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-extrabold border border-white/20 tracking-wider">
                  v{pkg.version}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-wider mt-3 text-white">
                SIRESA
              </h2>
              <p className="text-[11px] text-nayarit-lightGold font-bold uppercase tracking-wider mt-1">
                Sistema de Registro de Solicitudes de Apoyo
              </p>
            </div>
          </div>

          {/* Bloque Inferior: Identidad Oficial */}
          <div className="pt-8 border-t border-white/10 relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-nayarit-lightGold text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>SECRETARÍA DE DESARROLLO RURAL</span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">
              2026. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: Formulario de Autenticación */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between bg-white relative">
          <div className="space-y-6">
            {/* Header del Formulario */}
            <div>
              <span className="text-[10px] font-extrabold text-nayarit-gold uppercase tracking-widest block">
                Acceso Restringido
              </span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                Iniciar Sesión
              </h3>
              <p className="text-xs text-slate-450 font-medium mt-1">
                Ingresa tus credenciales autorizadas de servidor público.
              </p>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 flex items-start gap-3 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Usuario */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Usuario Institucional
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. admin"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-nayarit-gold focus:bg-white focus:ring-2 focus:ring-nayarit-gold/20 transition-smooth"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-nayarit-gold focus:bg-white focus:ring-2 focus:ring-nayarit-gold/20 transition-smooth"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 transition-smooth cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botón Ingresar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#5E1232] via-[#480c25] to-[#5E1232] hover:from-[#781840] hover:to-[#5E1232] text-white font-extrabold uppercase tracking-wider text-xs rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4 text-nayarit-lightGold" />
                  </>
                )}
              </button>
            </form>

            {/* Pie Informativo Institucional y Versión Actual */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 text-center">
              <span className="text-[10px] font-extrabold text-[#5E1232] bg-nayarit-gold/15 px-2.5 py-0.5 rounded-full border border-nayarit-gold/30 tracking-wider">
                SIRESA v{pkg.version}
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight">
                Secretaría de Desarrollo Rural<br />Gobierno del Estado de Nayarit
              </span>
            </div>
          </div>


        </div>

      </div>
    </div>
  );
}
