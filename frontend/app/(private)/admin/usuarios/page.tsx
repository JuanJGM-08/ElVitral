'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'usuario' | 'admin';
  aprobado: boolean;
  activo: boolean;
  ultimo_acceso?: string | null;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmRole, setConfirmRole] = useState<{ usuario: Usuario; rol: 'usuario' | 'admin' } | null>(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios', { credentials: 'include' });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsuarios, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateUser = async (id: string, changes: Partial<Pick<Usuario, 'aprobado' | 'activo' | 'rol'>>) => {
    setError('');
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...changes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar el usuario');
      setUsuarios(prev => prev.map(user => user.id === id ? { ...user, ...changes } : user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    }
  };

  const changeRole = (usuario: Usuario, rol: 'usuario' | 'admin') => {
    if (rol !== usuario.rol) setConfirmRole({ usuario, rol });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando usuarios del sistema...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Control de Accesos
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{usuarios.length} usuarios registrados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400 text-3xl">group</span>
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Administra roles, autorización de cuentas y estados de acceso al sistema.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsuarios}
            title="Recargar datos"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-gray-700/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── TABLA DE USUARIOS CON DISEÑO MODERNO ── */}
      {usuarios.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">person_off</span>
          <p className="text-gray-300 text-base font-semibold">No hay usuarios registrados</p>
          <p className="text-gray-500 text-xs mt-1">Cuando los usuarios se registren aparecerán aquí.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#182233] border-b border-gray-800 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Usuario</th>
                  <th className="px-6 py-3.5">Contacto</th>
                  <th className="px-6 py-3.5">Rol</th>
                  <th className="px-6 py-3.5">Último Acceso</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70 text-sm">
                {usuarios.map(usuario => (
                  <tr key={usuario.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Nombre y Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-cyan-500/20 shrink-0">
                          {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {usuario.nombre}
                          </p>
                          <p className="text-xs text-gray-400">{usuario.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="px-6 py-4 text-xs text-gray-300 font-mono">
                      {usuario.telefono || <span className="text-gray-500 italic">No registrado</span>}
                    </td>

                    {/* Rol con selector estilizado */}
                    <td className="px-6 py-4">
                      <select
                        value={usuario.rol}
                        onChange={e => changeRole(usuario, e.target.value as 'usuario' | 'admin')}
                        className="rounded-xl bg-[#0f141f] border border-gray-700/80 px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="usuario">Usuario Estándar</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>

                    {/* Último Acceso */}
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {usuario.ultimo_acceso ? (
                        new Date(usuario.ultimo_acceso).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        <span className="text-gray-500 italic">Nunca</span>
                      )}
                    </td>

                    {/* Estados en Píldoras */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            usuario.activo
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${usuario.activo ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            usuario.aprobado
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {usuario.aprobado ? 'Aprobado' : 'Pendiente'}
                        </span>
                      </div>
                    </td>

                    {/* Acciones Rápidas */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => updateUser(usuario.id, { aprobado: !usuario.aprobado })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            usuario.aprobado
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {usuario.aprobado ? 'Desaprobar' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => updateUser(usuario.id, { activo: !usuario.activo })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            usuario.activo
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {usuario.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN DE ROL MODERNO ── */}
      {confirmRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#141b28] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <span className="material-symbols-outlined text-2xl">manage_accounts</span>
              </div>
              <h2 className="text-lg font-bold text-white">¿Confirmar cambio de rol?</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              El usuario <strong className="text-white">{confirmRole.usuario.nombre}</strong> tendrá permisos de{' '}
              <strong className="text-cyan-400">{confirmRole.rol === 'admin' ? 'Administrador' : 'Usuario estándar'}</strong> en el sistema.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmRole(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/80 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateUser(confirmRole.usuario.id, { rol: confirmRole.rol });
                  setConfirmRole(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all cursor-pointer"
              >
                Sí, cambiar rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
