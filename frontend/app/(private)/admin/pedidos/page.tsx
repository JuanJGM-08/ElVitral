'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

interface Pedido {
  id: number;
  cotizacion_id?: number;
  usuario_id: number;
  fecha_pedido: string;
  fecha_entrega?: string;
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
  pago: 'pendiente' | 'pagado' | 'anticipo';
  total: number;
  notas?: string;
  nombre_cliente?: string;
}

const estadosOrdenados: Array<Pedido['estado']> = [
  'pendiente',
  'en_proceso',
  'listo',
  'entregado'
];

const etiquetasEstado: Record<Pedido['estado'], string> = {
  pendiente: 'Pendientes de Producción',
  en_proceso: 'En Proceso de Fabricación',
  listo: 'Listos para Entrega',
  entregado: 'Entregados y Completados'
};

const badgeEstado: Record<Pedido['estado'], string> = {
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  en_proceso: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  listo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  entregado: 'bg-gray-700/40 text-gray-400 border-gray-700'
};

const badgePago: Record<Pedido['pago'], string> = {
  pendiente: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  anticipo: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  pagado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
};

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'estado' | 'pago';
    pedidoId: number;
    nuevoValor: string;
    mensaje: string;
    fechaEntrega?: string;
  } | null>(null);

  const [showFechaModal, setShowFechaModal] = useState(false);
  const [fechaEntregaInput, setFechaEntregaInput] = useState('');
  const [mobileActionPedido, setMobileActionPedido] = useState<Pedido | null>(null);

  const fetchPedidos = async () => {
    try {
      const res = await fetch('/api/admin/pedidos', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(errorData?.error || `Error: ${res.status} ${res.statusText}`);
        setPedidos([]);
        return;
      }

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPedidos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const actualizarEstado = async (pedidoId: number, nuevoEstado: string) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido || nuevoEstado === pedido.estado) return;

    if (nuevoEstado === 'entregado' && !pedido.fecha_entrega) {
      setMensaje({ tipo: 'error', texto: 'Debe establecer la fecha de entrega antes de marcar el pedido como entregado. Cambie el estado a "Listo" primero.' });
      return;
    }

    if (nuevoEstado === 'listo' && !pedido.fecha_entrega) {
      setConfirmAction({
        type: 'estado',
        pedidoId,
        nuevoValor: nuevoEstado,
        mensaje: `¿Marcar el pedido #${pedidoId} como listo?`,
      });
      setFechaEntregaInput('');
      setShowFechaModal(true);
      return;
    }

    setConfirmAction({
      type: 'estado',
      pedidoId,
      nuevoValor: nuevoEstado,
      mensaje: `¿Cambiar el estado del pedido #${pedidoId} de "${pedido.estado}" a "${nuevoEstado}"?`
    });
    setShowConfirmModal(true);
  };

  const actualizarPago = async (pedidoId: number, nuevoPago: string) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido || nuevoPago === pedido.pago) return;

    setConfirmAction({
      type: 'pago',
      pedidoId,
      nuevoValor: nuevoPago,
      mensaje: `¿Cambiar el estado de pago del pedido #${pedidoId} de "${pedido.pago}" a "${nuevoPago}"?`
    });
    setShowConfirmModal(true);
  };

  const descargarPdfPedido = (id: number) => {
    const url = `/api/admin/pedidos/${id}/pdf`;
    window.open(url, '_blank');
  };

  const confirmarFechaEntrega = () => {
    if (!fechaEntregaInput) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar una fecha de entrega' });
      return;
    }

    setShowFechaModal(false);
    setConfirmAction((prev) =>
      prev ? { ...prev, fechaEntrega: fechaEntregaInput } : null
    );
    setShowConfirmModal(true);
  };

  const confirmarCambio = async () => {
    if (!confirmAction) return;

    try {
      const payload: Record<string, string> = {
        [confirmAction.type]: confirmAction.nuevoValor,
      };

      if (confirmAction.fechaEntrega) {
        payload.fecha_entrega = confirmAction.fechaEntrega;
      }

      const res = await fetch(`/api/admin/pedidos/${confirmAction.pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMensaje({ tipo: 'ok', texto: 'Pedido actualizado correctamente' });
        fetchPedidos();
      } else {
        const errorData = await res.json().catch(() => null);
        setMensaje({ tipo: 'error', texto: errorData?.error || `Error al actualizar el ${confirmAction.type}` });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor' });
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const pedidosPorEstado = useMemo(() => {
    return estadosOrdenados.reduce<Record<Pedido['estado'], Pedido[]>>((acc, estado) => {
      acc[estado] = pedidos.filter((pedido) => pedido.estado === estado);
      return acc;
    }, {
      pendiente: [],
      en_proceso: [],
      listo: [],
      entregado: []
    });
  }, [pedidos]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando pedidos de clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Despachos y Ventas
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{pedidos.length} órdenes en total</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-sky-400 text-3xl">local_shipping</span>
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Supervisa el estado de producción, pagos recibidos por Stripe o efectivo y comprobantes de despacho.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPedidos}
            title="Recargar pedidos"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-gray-700/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── MENSAJES DE ALERTA ── */}
      {mensaje && (
        <div
          className={`rounded-xl border p-4 text-sm flex items-center justify-between gap-3 ${
            mensaje.tipo === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">
              {mensaje.tipo === 'ok' ? 'check_circle' : 'error'}
            </span>
            <span>{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── SECCIONES AGRUPADAS POR ESTADO ── */}
      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">inventory</span>
          <p className="text-gray-300 text-base font-semibold">No hay pedidos registrados</p>
          <p className="text-gray-500 text-xs mt-1">Los pedidos convertidos desde cotizaciones aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {estadosOrdenados.map((estado) => {
            const pedidosEstado = pedidosPorEstado[estado];
            return (
              <section
                key={estado}
                className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden"
              >
                {/* Cabecera del Grupo */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#182233]">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{etiquetasEstado[estado]}</span>
                      <span className="text-xs font-normal text-gray-400">({pedidosEstado.length})</span>
                    </h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border capitalize ${badgeEstado[estado]}`}
                  >
                    {estado}
                  </span>
                </div>

                {pedidosEstado.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    No hay pedidos en este estado actualmente.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-[#121824] text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-800/60">
                        <tr>
                          <th className="px-5 py-3">ID</th>
                          <th className="px-5 py-3">Cliente</th>
                          <th className="px-5 py-3">Fecha Pedido</th>
                          <th className="px-5 py-3">Fecha Entrega</th>
                          <th className="px-5 py-3">Total</th>
                          <th className="px-5 py-3">Estado Pago</th>
                          <th className="px-5 py-3">Cambiar Proceso</th>
                          <th className="px-5 py-3">Cambiar Pago</th>
                          <th className="px-5 py-3 text-right">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-sm">
                        {pedidosEstado.map((pedido) => (
                          <tr key={pedido.id} className="hover:bg-white/[0.02] transition-colors group">
                            {/* ID */}
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-cyan-400 whitespace-nowrap">
                              #{pedido.id}
                            </td>

                            {/* Cliente */}
                            <td className="px-5 py-3.5 font-semibold text-white whitespace-nowrap group-hover:text-cyan-400 transition-colors">
                              {pedido.nombre_cliente || 'Sin nombre registrado'}
                            </td>

                            {/* Fecha Pedido */}
                            <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(pedido.fecha_pedido).toLocaleDateString('es-CO')}
                            </td>

                            {/* Fecha Entrega */}
                            <td className="px-5 py-3.5 text-xs text-gray-300 whitespace-nowrap">
                              {pedido.fecha_entrega ? (
                                <span className="text-emerald-400 font-medium">
                                  {new Date(pedido.fecha_entrega).toLocaleDateString('es-CO')}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">No asignada</span>
                              )}
                            </td>

                            {/* Total */}
                            <td className="px-5 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                              ${formatNumber(pedido.total)} COP
                            </td>

                            {/* Estado Pago Badge */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border capitalize ${badgePago[pedido.pago]}`}
                              >
                                {pedido.pago}
                              </span>
                            </td>

                            {/* Selector Estado Proceso */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <select
                                value={pedido.estado}
                                onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                                className="rounded-xl bg-[#0f141f] border border-gray-700/80 px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="en_proceso">En proceso</option>
                                <option value="listo">Listo</option>
                                <option value="entregado" disabled={!pedido.fecha_entrega}>
                                  Entregado{!pedido.fecha_entrega ? ' (requiere fecha)' : ''}
                                </option>
                              </select>
                            </td>

                            {/* Selector Estado Pago */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <select
                                value={pedido.pago}
                                onChange={(e) => actualizarPago(pedido.id, e.target.value)}
                                className="rounded-xl bg-[#0f141f] border border-gray-700/80 px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="anticipo">Anticipo</option>
                                <option value="pagado">Pagado</option>
                              </select>
                            </td>

                            {/* Exportar PDF */}
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => descargarPdfPedido(pedido.id)}
                                title="Descargar comprobante de pedido"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-400 border border-gray-700/80 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* ── MODAL FECHA DE ENTREGA ── */}
      {showFechaModal && confirmAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#141b28] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <span className="material-symbols-outlined text-2xl">event</span>
              </div>
              <h2 className="text-lg font-bold text-white">Fecha Programada de Entrega</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Indica la fecha acordada para despachar el pedido <strong className="text-cyan-400">#{confirmAction.pedidoId}</strong>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Fecha de Entrega</label>
              <input
                type="date"
                value={fechaEntregaInput}
                onChange={(e) => setFechaEntregaInput(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] text-white px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowFechaModal(false);
                  setConfirmAction(null);
                  setFechaEntregaInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarFechaEntrega}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN ── */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#141b28] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <span className="material-symbols-outlined text-2xl">help_outline</span>
              </div>
              <h2 className="text-lg font-bold text-white">Confirmar Actualización</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{confirmAction.mensaje}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCambio}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}