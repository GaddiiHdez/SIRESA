import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, ShieldCheck, Crown, UserCheck, 
  Trash2, Edit3, KeyRound, AlertTriangle, CheckCircle2, Lock, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { apiGetUsers, apiCrearUsuario, apiActualizarUsuario, apiEliminarUsuario, getCurrentUser } from '../../../shared/services/api';
import { toast } from '../../../shared/utils/toast';
import UsuarioModal from '../components/UsuarioModal';

export default function ConfiguracionUsuariosPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currentUser = getCurrentUser() || {};
  const isCurrentUserSuperAdmin = currentUser.role === 'SUPERADMIN';

  // Notificar al Navbar sobre la vista activa
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        active: true,
        label: 'ADMINISTRACIÓN Y ACCESOS',
        title: 'GESTIÓN DE USUARIOS Y ROLES',
        iconKey: 'DASHBOARD',
        actions: []
      }
    }));
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGetUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'TODOS' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Contadores de resumen
  const stats = useMemo(() => {
    const total = users.length;
    const superadmins = users.filter(u => u.role === 'SUPERADMIN').length;
    const admins = users.filter(u => u.role === 'ADMINISTRADOR').length;
    const funcionarios = users.filter(u => u.role === 'FUNCIONARIO').length;
    const analistas = users.filter(u => u.role === 'ANALISTA').length;
    return { total, superadmins, admins, funcionarios, analistas };
  }, [users]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData) => {
    if (editingUser) {
      await apiActualizarUsuario(editingUser.id, formData);
      toast.success(`Usuario @${formData.username || editingUser.username} actualizado con éxito.`);
    } else {
      await apiCrearUsuario(formData);
      toast.success(`Usuario @${formData.username} creado con éxito.`);
    }
    await loadUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiEliminarUsuario(deleteTarget.id);
      toast.success(`Usuario @${deleteTarget.username} eliminado del sistema.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error(error.message || 'No se pudo eliminar el usuario.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper de renders de Badges
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 border border-amber-500/30 shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            SUPERADMIN
          </span>
        );
      case 'ADMINISTRADOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-nayarit-gold/15 text-nayarit-dark border border-nayarit-gold/30">
            <ShieldCheck className="w-3.5 h-3.5 text-nayarit-gold" />
            ADMINISTRADOR
          </span>
        );
      case 'FUNCIONARIO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            FUNCIONARIO
          </span>
        );
      case 'ANALISTA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            ANALISTA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-nayarit-gold/10 text-nayarit-gold rounded-xl border border-nayarit-gold/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-900">{stats.superadmins}</div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">SuperAdmin (Tú)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-nayarit-gold rounded-xl border border-nayarit-gold/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats.admins}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administradores</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats.funcionarios + stats.analistas}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operativos / Analistas</div>
          </div>
        </div>

      </div>

      {/* BANNER PRINCIPAL Y BARRA DE HERRAMIENTAS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                Directorio de Usuarios de SIRESA
              </h2>
              <span className="text-xs font-extrabold bg-nayarit-gold/20 text-nayarit-dark px-2 py-0.5 rounded-full border border-nayarit-gold/30">
                Seguridad & Roles
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Administra accesos, asigna roles jerárquicos y restablece credenciales de los funcionarios del sistema.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5E1232] to-[#3a051a] text-white rounded-xl text-xs font-extrabold tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-nayarit-lightGold" />
            Nuevo Usuario
          </button>
        </div>

        {/* FILTROS Y BUSCADOR */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o usuario @..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-nayarit-gold/40 focus:border-nayarit-gold transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Filtros por Rol */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['TODOS', 'SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  roleFilter === role
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {role}
              </button>
            ))}

            <button
              onClick={loadUsers}
              title="Recargar lista"
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* TABLA DE USUARIOS */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold uppercase tracking-wider">Cargando directorio de usuarios...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-600">No se encontraron usuarios</div>
              <p className="text-xs text-slate-400">Intenta cambiando el filtro de búsqueda o agrega un nuevo usuario.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-6">Usuario / Servidor Público</th>
                  <th className="py-3.5 px-4">Identificador (@)</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Fecha de Registro</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  const isSuper = u.role === 'SUPERADMIN' || u.username === 'admin';
                  
                  // Jerarquía de protección: 
                  // Si el objetivo es SuperAdmin y el usuario actual NO es SuperAdmin, está bloqueado.
                  const isProtectedFromCurrent = isSuper && !isCurrentUserSuperAdmin;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isSelf ? 'bg-amber-50/20' : ''}`}>
                      
                      {/* Avatar y Nombre */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs border ${
                            isSuper 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : u.role === 'ADMINISTRADOR'
                              ? 'bg-nayarit-gold/20 text-nayarit-dark border-nayarit-gold/40'
                              : u.role === 'FUNCIONARIO'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {isSuper ? 'Cuenta Principal / SuperAdmin' : 'Usuario Autorizado SIRESA'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        @{u.username}
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(u.role)}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            disabled={isProtectedFromCurrent}
                            title={
                              isProtectedFromCurrent 
                                ? 'No tienes permisos para modificar a un SuperAdministrador'
                                : 'Editar usuario y contraseña'
                            }
                            className={`p-1.5 rounded-lg border transition-all ${
                              isProtectedFromCurrent
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-nayarit-gold/10 hover:text-nayarit-dark hover:border-nayarit-gold/30'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelf || isProtectedFromCurrent || u.username === 'admin'}
                            title={
                              isSelf 
                                ? 'No puedes eliminar tu propia cuenta' 
                                : u.username === 'admin'
                                ? 'El usuario principal admin no se puede eliminar'
                                : isProtectedFromCurrent
                                ? 'Protegido por jerarquía SuperAdmin'
                                : 'Eliminar usuario'
                            }
                            className={`p-1.5 rounded-lg border transition-all ${
                              isSelf || isProtectedFromCurrent || u.username === 'admin'
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-white text-red-500 border-slate-200 hover:bg-red-50 hover:border-red-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info de jerarquía */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Regla de Seguridad:</strong> La cuenta principal <strong>SuperAdmin</strong> no puede ser eliminada ni alterada por Administradores secundarios.
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            SIRESA v2.5 • Módulo RBAC
          </div>
        </div>

      </div>

      {/* MODAL DE EDICIÓN Y CREACIÓN */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
        currentUser={currentUser}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-800 uppercase tracking-wide">
                ¿Eliminar Usuario?
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Estás a punto de borrar permanentemente la cuenta de <strong className="text-slate-800">{deleteTarget.name}</strong> (<span className="font-mono text-slate-700">@{deleteTarget.username}</span>).
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-[11px] text-red-700 font-medium">
              ⚠️ Esta acción revocará de inmediato el acceso al sistema para este usuario. Esta operación no se puede deshacer.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Sí, Eliminar Usuario
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
