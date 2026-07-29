import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, User, KeyRound, UserCheck, Crown, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';

export default function UsuarioModal({ isOpen, onClose, onSave, editingUser, currentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'FUNCIONARIO',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(editingUser);
  const isTargetSuperAdmin = editingUser && (editingUser.role === 'SUPERADMIN' || editingUser.username === 'admin');
  const canAssignSuperAdmin = currentUser?.role === 'SUPERADMIN';

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        username: editingUser.username || '',
        password: '',
        role: editingUser.role || 'FUNCIONARIO',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'FUNCIONARIO',
      });
    }
    setShowPassword(false);
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Por favor ingresa el nombre completo del usuario.');
      return;
    }

    if (!formData.username.trim()) {
      toast.error('Por favor ingresa el nombre de usuario.');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('La contraseña inicial es requerida para un usuario nuevo.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al guardar usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
    setShowPassword(true);
    toast.info('Contraseña aleatoria generada.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera Modal */}
        <div className="bg-gradient-to-r from-[#5E1232] via-[#480c25] to-[#200210] text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              {formData.role === 'SUPERADMIN' ? (
                <Crown className="w-5 h-5 text-amber-300 animate-bounce" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-nayarit-lightGold" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide uppercase text-white">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario SIRESA'}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {isEditing ? `Modificando credenciales de @${editingUser.username}` : 'Asigna roles y permisos de acceso'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Nombre Completo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Lic. Roberto Mendoza"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-nayarit-gold/50 focus:border-nayarit-gold transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Nombre de Usuario */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nombre de Usuario (Login) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="text-xs font-black text-slate-400 absolute left-3.5 top-3">@</span>
              <input
                type="text"
                required
                disabled={isEditing && editingUser.username === 'admin'}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                placeholder="rmendoza"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-nayarit-gold/50 focus:border-nayarit-gold transition-all font-mono font-semibold text-slate-800 disabled:opacity-60 disabled:bg-slate-100"
              />
            </div>
            {isEditing && editingUser.username === 'admin' && (
              <p className="text-[10px] text-amber-700 font-semibold mt-1">
                🔒 El identificador principal 'admin' no se puede renombrar.
              </p>
            )}
          </div>

          {/* Seleccionador de Rol */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Rol de Usuario y Nivel de Acceso <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              
              {/* Rol SUPERADMIN */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  formData.role === 'SUPERADMIN' 
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                } ${!canAssignSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="SUPERADMIN"
                  disabled={!canAssignSuperAdmin}
                  checked={formData.role === 'SUPERADMIN'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    Super Administrador (Protegido)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Acceso total del sistema. Ningún administrador común puede modificar ni eliminar a usuarios con este rol.
                  </p>
                </div>
              </label>

              {/* Rol ADMINISTRADOR */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  formData.role === 'ADMINISTRADOR' 
                    ? 'border-nayarit-gold bg-amber-50/30 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="ADMINISTRADOR"
                  checked={formData.role === 'ADMINISTRADOR'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 accent-nayarit-gold"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-nayarit-gold" />
                    Administrador
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gestión de expedientes, catálogos, reportes y administración de usuarios comunes (Funcionarios y Analistas).
                  </p>
                </div>
              </label>

              {/* Rol FUNCIONARIO */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  formData.role === 'FUNCIONARIO' 
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="FUNCIONARIO"
                  checked={formData.role === 'FUNCIONARIO'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 accent-emerald-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Funcionario / Capturista
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Registro de solicitudes de apoyo, actualización de estatus, carga de expedientes y dictaminación.
                  </p>
                </div>
              </label>

              {/* Rol ANALISTA */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  formData.role === 'ANALISTA' 
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="ANALISTA"
                  checked={formData.role === 'ANALISTA'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Analista / Consultor (Solo Lectura)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Consulta de expedientes, seguimiento de avances y exportación de reportes ejecutivos. Sin permiso de edición.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Contraseña */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-nayarit-gold hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> Generar Segura
              </button>
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!isEditing}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEditing ? '•••••••• (Sin cambios)' : 'Mínimo 6 caracteres'}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-nayarit-gold/50 focus:border-nayarit-gold transition-all text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isEditing && (
              <p className="text-[10px] text-slate-400 mt-1">
                Déjalo vacío si no deseas modificar la contraseña del usuario.
              </p>
            )}
          </div>

          {/* Footer de Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nayarit-gold to-[#a27e3d] text-white font-extrabold text-xs tracking-wider uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
