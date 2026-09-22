'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Cita {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  fecha_cita: string;
  tipo: 'entrega' | 'consulta' | 'medidas' | 'pago' | 'otro';
  estado: 'pendiente' | 'confirmada' | 'realizada' | 'cancelada';
  notas: string;
  fecha_creacion: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const tiposIconos: Record<string, string> = {
  entrega: 'inventory',
  consulta: 'chat',
  medidas: 'straighten',
  pago: 'payments',
  otro: 'event',
};

const estadoColores: Record<string, string> = {
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  confirmada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  realizada: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  cancelada: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function AgendaAdminPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [usuarios, setUsuarios] = useState<Record<number, Usuario>>({});
  const [diasDisponibles, setDiasDisponibles] = useState<string[]>([]);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [mensajeDias, setMensajeDias] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<string>('todas');
  const [mobileActionCita, setMobileActionCita] = useState<Cita | null>(null);
  const [confirmFecha, setConfirmFecha] = useState<string | null>(null);
  const [confirmCitaId, setConfirmCitaId] = useState<number | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [citasRes, usuariosRes, diasRes] = await Promise.all([
        fetch('/api/admin/agenda', { credentials: 'include' }),
        fetch('/api/admin/usuarios', { credentials: 'include' }),
        fetch('/api/admin/agenda/dias-disponibles', { credentials: 'include' }),
      ]);

      if (!citasRes.ok) throw new Error('Error al cargar citas.');
      if (!usuariosRes.ok) throw new Error('Error al cargar usuarios.');

      const [citasData, usuariosData] = await Promise.all([
        citasRes.json(),
        usuariosRes.json(),
      ]);

      if (diasRes.ok) {
        const diasData = await diasRes.json();
        setDiasDisponibles(Array.isArray(diasData) ? diasData : []);
      }

      setCitas(
        Array.isArray(citasData)
          ? citasData.sort((a: Cita, b: Cita) => new Date(b.fecha_cita).getTime() - new Date(a.fecha_cita).getTime())
          : []
      );

      const usuariosMap: Record<number, Usuario> = {};
      if (Array.isArray(usuariosData)) {
        usuariosData.forEach((u: Usuario) => {
          usuariosMap[u.id] = u;
        });
      }
      setUsuarios(usuariosMap);
      setError('');
    } catch {
      setError('Error al cargar la información de la agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleAgregarFecha = async () => {
    if (!nuevaFecha) return;
    setMensajeDias(null);
    try {
      const res = await fetch('/api/admin/agenda/dias-disponibles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: nuevaFecha }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDiasDisponibles((prev) => [...prev, nuevaFecha].sort());
        setNuevaFecha('');
        setMensajeDias({ tipo: 'ok', texto: 'Fecha habilitada correctamente para citas.' });
      } else {
        setMensajeDias({ tipo: 'error', texto: data.error || `Error (${res.status})` });
      }
    } catch {
      setMensajeDias({ tipo: 'error', texto: 'Error de conexión al habilitar la fecha.' });
    }
  };

  const handleEliminarFecha = async (fecha: string) => {
    setMensajeDias(null);
    try {
      const res = await fetch('/api/admin/agenda/dias-disponibles', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDiasDisponibles((prev) => prev.filter((d) => d !== fecha));
        setMensajeDias({ tipo: 'ok', texto: 'Fecha deshabilitada correctamente.' });
      } else {
        setMensajeDias({ tipo: 'error', texto: data.error || `Error (${res.status})` });
      }
    } catch {
      setMensajeDias({ tipo: 'error', texto: 'Error al deshabilitar la fecha.' });
    } finally {
      setConfirmFecha(null);
    }
  };

  const fechaParaDisplay = (fecha: string) => {
    const d = new Date(`${fecha}T12:00:00`);
    if (Number.isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleActualizarEstado = async (citaId: number, nuevoEstado: string) => {
    try {
      const cita = citas.find(c => c.id === citaId);
      if (!cita) return;

      const body = {
        id: citaId,
        titulo: cita.titulo,
        fecha_cita: cita.fecha_cita,
        tipo: cita.tipo,
        notas: cita.notas || '',
        estado: nuevoEstado,
      };

      const res = await fetch('/api/agenda/citas', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setCitas(citas.map(c => c.id === citaId ? { ...c, estado: nuevoEstado as Cita['estado'] } : c));
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const handleEliminarCita = async (citaId: number) => {
    try {
      const res = await fetch('/api/agenda/citas', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: citaId }),
      });

      if (res.ok) {
        setCitas(citas.filter(c => c.id !== citaId));
      }
    } catch (error) {
      console.error('Error eliminando cita:', error);
    } finally {
      setConfirmCitaId(null);
    }
  };

  const citasFiltradas = filtro === 'todas' 
    ? citas 
    : citas.filter(c => c.estado === filtro);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando agenda de citas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Calendario y Atención
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{citas.length} citas registradas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-rose-400 text-3xl">calendar_month</span>
            Agenda de Citas
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Habilita días laborales para citas y administra las solicitudes de medición, entrega y consultas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            title="Recargar agenda"
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

      {/* ── CARD: HABILITAR FECHAS DISPONIBLES ── */}
      <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <span className="material-symbols-outlined text-xl">event_available</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Fechas Habilitadas para Agendar</h2>
              <p className="text-xs text-gray-400">Solo en estos días los clientes pueden solicitar citas desde la tienda.</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-gray-700 text-gray-300">
            {diasDisponibles.length} días activos
          </span>
        </div>

        {mensajeDias && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
              mensajeDias.tipo === 'ok'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                {mensajeDias.tipo === 'ok' ? 'check_circle' : 'error'}
              </span>
              <span>{mensajeDias.texto}</span>
            </div>
            <button onClick={() => setMensajeDias(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Input para agregar fecha */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={nuevaFecha}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setNuevaFecha(e.target.value)}
            className="flex-1 rounded-xl border border-gray-700/80 bg-[#0f141f] text-white px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleAgregarFecha}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Habilitar Día</span>
          </button>
        </div>

        {/* Lista de chips de fechas habilitadas */}
        <div className="pt-2">
          {diasDisponibles.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No hay días habilitados. Agrega una fecha arriba para habilitar reservas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {diasDisponibles.map((fecha) => (
                <div
                  key={fecha}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f141f] border border-gray-700/80 px-3 py-1.5 text-xs text-gray-200 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm text-cyan-400">calendar_today</span>
                  <span className="font-medium capitalize">{fechaParaDisplay(fecha)}</span>

                  {confirmFecha === fecha ? (
                    <div className="inline-flex items-center gap-1.5 ml-1 border-l border-gray-700 pl-1.5">
                      <span className="text-[10px] text-gray-400">¿Quitar?</span>
                      <button
                        onClick={() => handleEliminarFecha(fecha)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmFecha(null)}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmFecha(fecha)}
                      className="text-gray-500 hover:text-rose-400 transition-colors p-0.5"
                      title="Deshabilitar fecha"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CHIPS DE FILTRO POR ESTADO (ESTILO YOUTUBE) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-gray-400 font-medium mr-1 shrink-0">Filtrar:</span>
        {[
          { id: 'todas', label: `Todas (${citas.length})` },
          { id: 'pendiente', label: `Pendientes (${citas.filter(c => c.estado === 'pendiente').length})` },
          { id: 'confirmada', label: `Confirmadas (${citas.filter(c => c.estado === 'confirmada').length})` },
          { id: 'realizada', label: `Realizadas (${citas.filter(c => c.estado === 'realizada').length})` },
          { id: 'cancelada', label: `Canceladas (${citas.filter(c => c.estado === 'cancelada').length})` },
        ].map((btn) => {
          const active = filtro === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setFiltro(btn.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                active
                  ? 'bg-rose-500 text-white shadow-xs font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-800'
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* ── LISTADO / TABLA DE CITAS ── */}
      {citasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">event_busy</span>
          <p className="text-gray-300 text-base font-semibold">No hay citas para mostrar</p>
          <p className="text-gray-500 text-xs mt-1">Prueba seleccionando otro filtro o espera nuevas reservas.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden">
          {/* Vista Escritorio / Tablet (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#182233] border-b border-gray-800 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Tipo</th>
                  <th className="px-6 py-3.5">Detalle / Asunto</th>
                  <th className="px-6 py-3.5">Usuario</th>
                  <th className="px-6 py-3.5">Fecha y Hora</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70 text-sm">
                {citasFiltradas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Tipo con icono */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-gray-700/60 text-xs font-semibold text-gray-300 capitalize">
                        <span className="material-symbols-outlined text-base text-cyan-400">
                          {tiposIconos[cita.tipo] || 'event'}
                        </span>
                        {cita.tipo}
                      </span>
                    </td>

                    {/* Título y descripción */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {cita.titulo}
                      </p>
                      {cita.descripcion && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{cita.descripcion}</p>
                      )}
                    </td>

                    {/* Usuario */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-white">
                        {usuarios[cita.usuario_id]?.nombre || 'Usuario Registrado'}
                      </p>
                      <p className="text-[11px] text-gray-400">{usuarios[cita.usuario_id]?.email}</p>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 text-xs text-gray-300 whitespace-nowrap font-medium">
                      {new Date(cita.fecha_cita).toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Selector de Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={cita.estado}
                        onChange={(e) => handleActualizarEstado(cita.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${estadoColores[cita.estado]} bg-[#0f141f] focus:outline-none cursor-pointer`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="realizada">Realizada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>

                    {/* Eliminar cita */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {confirmCitaId === cita.id ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] text-rose-300 font-medium">¿Eliminar?</span>
                          <button
                            onClick={() => handleEliminarCita(cita.id)}
                            className="px-2 py-1 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmCitaId(null)}
                            className="px-1.5 py-1 text-xs text-gray-400 hover:text-white"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCitaId(cita.id)}
                          title="Eliminar cita"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil (< md) */}
          <div className="block md:hidden p-4 space-y-3">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="bg-[#0f141f] border border-gray-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 capitalize">
                    <span className="material-symbols-outlined text-sm">{tiposIconos[cita.tipo] || 'event'}</span>
                    {cita.tipo}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${estadoColores[cita.estado]}`}>
                    {cita.estado}
                  </span>
                </div>
                <h3 className="text-white font-bold text-sm">{cita.titulo}</h3>
                {cita.descripcion && <p className="text-xs text-gray-400">{cita.descripcion}</p>}
                <div className="text-xs text-gray-300 pt-1 border-t border-gray-800/80 flex items-center justify-between">
                  <span>{usuarios[cita.usuario_id]?.nombre || 'Usuario'}</span>
                  <span>{new Date(cita.fecha_cita).toLocaleDateString('es-CO')}</span>
                </div>
                <button
                  onClick={() => setMobileActionCita(cita)}
                  className="w-full py-2 rounded-lg bg-white/5 border border-gray-700 text-xs font-semibold text-white"
                >
                  Gestionar Cita
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL ACCIONES MÓVIL ── */}
      {mobileActionCita && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-end justify-center z-[60] p-4 md:hidden">
          <div className="w-full rounded-2xl border border-gray-800 bg-[#141b28] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-sm">Gestionar Cita</h3>
              <button onClick={() => setMobileActionCita(null)} className="text-gray-400">✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estado</label>
              <select
                value={mobileActionCita.estado}
                onChange={(e) => {
                  handleActualizarEstado(mobileActionCita.id, e.target.value);
                  setMobileActionCita({ ...mobileActionCita, estado: e.target.value as Cita['estado'] });
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border ${estadoColores[mobileActionCita.estado]} bg-[#0f141f]`}
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <button
              onClick={() => {
                handleEliminarCita(mobileActionCita.id);
                setMobileActionCita(null);
              }}
              className="w-full py-2 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Eliminar Cita
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
