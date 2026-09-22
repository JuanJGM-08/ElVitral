'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

interface Cotizacion {
  id: number;
  usuario_id?: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  fecha_cotizacion: string;
  subtotal: number;
  total: number;
  estado: string;
  codigo_unico: string;
}

interface CotizacionDetalle {
  id: number;
  codigo_unico: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  direccion_cliente?: string;
  fecha_cotizacion: string;
  total: number;
  estado: string;
  detalles?: Array<{
    descripcion: string;
    medida_largo?: number;
    medida_ancho?: number;
    cantidad: number;
    subtotal: number;
  }>;
}

export default function AdminCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionDetalle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('todas');
  
  // Mobile actions
  const [mobileActionCotizacion, setMobileActionCotizacion] = useState<Cotizacion | null>(null);

  // Modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cotizacionToConvert, setCotizacionToConvert] = useState<Cotizacion | CotizacionDetalle | null>(null);
  const [cotizacionToReject, setCotizacionToReject] = useState<CotizacionDetalle | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const fetchCotizaciones = async () => {
    try {
      const res = await fetch('/api/admin/cotizaciones', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(errorData?.error || `Error: ${res.status} ${res.statusText}`);
        setCotizaciones([]);
        return;
      }

      const data = await res.json();
      setCotizaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCotizaciones();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const verDetalles = async (codigo: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${codigo}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCotizacion(data);
        setShowModal(true);
      } else {
        setError('Error al cargar los detalles de la cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los detalles');
    }
  };

  const descargarPdfCotizacion = (id: number) => {
    const url = `/api/admin/cotizaciones/${id}/pdf`;
    window.open(url, '_blank');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCotizacion(null);
  };

  const convertirAPedido = async (cotizacion: Cotizacion | CotizacionDetalle) => {
    setCotizacionToConvert(cotizacion);
    setShowConfirmModal(true);
  };

  const confirmarConversion = async () => {
    if (!cotizacionToConvert) return;

    setConvertingId(cotizacionToConvert.id);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cotizacion_id: cotizacionToConvert.id,
        })
      });

      if (res.ok) {
        setModalMessage('Cotización convertida a pedido exitosamente');
        setShowSuccessModal(true);
        closeModal();
        fetchCotizaciones();
      } else {
        const errorData = await res.json();
        setModalMessage(errorData.error || 'Error al convertir la cotización');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setModalMessage('Error al conectar con el servidor');
      setShowErrorModal(true);
    } finally {
      setConvertingId(null);
      setCotizacionToConvert(null);
    }
  };

  const rechazarCotizacion = async () => {
    if (!cotizacionToReject) return;
    try {
      const res = await fetch(`/api/admin/cotizaciones/${cotizacionToReject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado: 'rechazada' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo rechazar la cotización');
      setModalMessage('Cotización rechazada correctamente');
      setShowSuccessModal(true);
      setCotizacionToReject(null);
      closeModal();
      fetchCotizaciones();
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'No se pudo rechazar la cotización');
      setShowErrorModal(true);
    }
  };

  const filteredCotizaciones = filterStatus === 'todas'
    ? cotizaciones
    : cotizaciones.filter(c => c.estado?.toLowerCase() === filterStatus.toLowerCase());

  const getStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'vigente':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'aprobada':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'convertida':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'rechazada':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-gray-700/40 text-gray-400 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando cotizaciones...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Presupuestos de Clientes
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{cotizaciones.length} solicitudes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400 text-3xl">request_quote</span>
            Gestión de Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Consulta detalles de medidas, convierte cotizaciones a pedidos o descarga el PDF oficial.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCotizaciones}
            title="Recargar cotizaciones"
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

      {/* ── CHIPS DE FILTRO POR ESTADO (ESTILO YOUTUBE) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-gray-400 font-medium mr-1 shrink-0">Filtrar:</span>
        {['todas', 'vigente', 'aprobada', 'convertida', 'rechazada'].map((st) => {
          const active = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                active
                  ? 'bg-amber-500 text-black shadow-xs font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-800'
              }`}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* ── TABLA DE COTIZACIONES ── */}
      {filteredCotizaciones.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">request_quote</span>
          <p className="text-gray-300 text-base font-semibold">No se encontraron cotizaciones</p>
          <p className="text-gray-500 text-xs mt-1">Las cotizaciones creadas por los clientes aparecerán aquí.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#182233] border-b border-gray-800 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Código</th>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70 text-sm">
                {filteredCotizaciones.map((cotizacion) => (
                  <tr key={cotizacion.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Código */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                        {cotizacion.codigo_unico}
                      </span>
                    </td>

                    {/* Cliente y correo */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {cotizacion.nombre_cliente}
                        </p>
                        <p className="text-xs text-gray-400">{cotizacion.email_cliente}</p>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">
                      ${formatNumber(cotizacion.total)} COP
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border capitalize ${getStatusBadge(
                          cotizacion.estado
                        )}`}
                      >
                        {cotizacion.estado}
                      </span>
                    </td>

                    {/* Botones de acción */}
                    <td className="px-6 py-4 text-right">
                      <div className="hidden md:flex items-center justify-end gap-2">
                        <button
                          onClick={() => descargarPdfCotizacion(cotizacion.id)}
                          title="Descargar PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-400 border border-gray-700/80 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => verDetalles(cotizacion.codigo_unico)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/10 text-white hover:text-cyan-400 border border-gray-700/80 hover:border-cyan-500/40 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                          <span>Detalles</span>
                        </button>
                      </div>
                      <div className="md:hidden">
                        <button
                          onClick={() => setMobileActionCotizacion(cotizacion)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-gray-700 text-xs text-white"
                        >
                          Opciones
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

      {/* ── MODAL DE DETALLES DE COTIZACIÓN ── */}
      {showModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl bg-[#141b28] border border-gray-800 flex flex-col max-h-[calc(100dvh-2rem)] my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#182233] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Detalle de Cotización</h2>
                  <p className="text-xs text-cyan-400 font-mono">Código: {selectedCotizacion.codigo_unico}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Información del Cliente en Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#0f141f] border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-500">Cliente:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedCotizacion.nombre_cliente}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedCotizacion.email_cliente}</p>
                </div>
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedCotizacion.telefono_cliente || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Dirección:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedCotizacion.direccion_cliente || 'N/A'}</p>
                </div>
              </div>

              {/* Tabla de Artículos Cotizados */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Artículos y Medidas
                </h3>
                <div className="rounded-xl border border-gray-800 overflow-hidden bg-[#0f141f]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#182233] text-gray-400 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Medidas</th>
                        <th className="p-3">Cantidad</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-200">
                      {selectedCotizacion.detalles?.map((det, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-medium text-white">{det.descripcion}</td>
                          <td className="p-3 text-gray-400">
                            {det.medida_largo && det.medida_ancho ? `${det.medida_largo} × ${det.medida_ancho} cm` : 'Estándar'}
                          </td>
                          <td className="p-3 font-mono">{det.cantidad}</td>
                          <td className="p-3 text-right font-mono font-semibold text-white">
                            ${formatNumber(det.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Destacado */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30">
                <span className="text-sm font-semibold text-amber-300">Total Cotizado:</span>
                <span className="text-2xl font-black font-mono text-white">
                  ${formatNumber(selectedCotizacion.total)} COP
                </span>
              </div>
            </div>

            {/* Footer de Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-4 border-t border-gray-800 bg-[#182233] shrink-0">
              <button
                onClick={() => descargarPdfCotizacion(selectedCotizacion.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-300 border border-gray-700/80 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>Exportar PDF</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedCotizacion.estado !== 'convertida' && selectedCotizacion.estado !== 'rechazada' && (
                  <>
                    <button
                      onClick={() => setCotizacionToReject(selectedCotizacion)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => convertirAPedido(selectedCotizacion)}
                      disabled={convertingId === selectedCotizacion.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
                      <span>{convertingId === selectedCotizacion.id ? 'Convirtiendo...' : 'Convertir a Pedido'}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/80 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMACIÓN DE CONVERSIÓN ── */}
      {showConfirmModal && cotizacionToConvert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#141b28] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="material-symbols-outlined text-2xl">shopping_cart</span>
              </div>
              <h2 className="text-lg font-bold text-white">¿Convertir en Pedido?</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              La cotización <strong className="text-cyan-400">{cotizacionToConvert.codigo_unico}</strong> de{' '}
              <strong className="text-white">{cotizacionToConvert.nombre_cliente}</strong> se creará como un nuevo pedido activo en el sistema.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarConversion}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all"
              >
                Confirmar Conversión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RECHAZO DE COTIZACIÓN ── */}
      {cotizacionToReject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#141b28] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <span className="material-symbols-outlined text-2xl">cancel</span>
              </div>
              <h2 className="text-lg font-bold text-white">¿Rechazar cotización?</h2>
            </div>
            <p className="text-sm text-gray-300">
              La cotización <strong className="text-cyan-400">{cotizacionToReject.codigo_unico}</strong> pasará a estado rechazada.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setCotizacionToReject(null)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-gray-300">
                Cancelar
              </button>
              <button onClick={rechazarCotizacion} className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md">
                Sí, rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE ÉXITO ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[80] p-4">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-[#141b28] p-6 text-center shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <h3 className="text-lg font-bold text-white">Operación Exitosa</h3>
            <p className="text-xs text-gray-300">{modalMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL DE ERROR ── */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[80] p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#141b28] p-6 text-center shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <h3 className="text-lg font-bold text-white">Ocurrió un Error</h3>
            <p className="text-xs text-rose-300">{modalMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ── ACCIONES MÓVIL ── */}
      {mobileActionCotizacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-end justify-center z-[60] md:hidden p-4">
          <div className="w-full rounded-2xl border border-gray-800 bg-[#141b28] p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="font-bold text-white text-sm">Opciones de Cotización</h3>
              <button onClick={() => setMobileActionCotizacion(null)} className="text-gray-400">✕</button>
            </div>
            <button
              onClick={() => {
                verDetalles(mobileActionCotizacion.codigo_unico);
                setMobileActionCotizacion(null);
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              Ver Detalles
            </button>
            <button
              onClick={() => {
                descargarPdfCotizacion(mobileActionCotizacion.id);
                setMobileActionCotizacion(null);
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 text-cyan-400 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Exportar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}