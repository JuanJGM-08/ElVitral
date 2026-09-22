'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  tipo_movimiento: string;
  descripcion?: string;
  pedido_id?: number;
  usuario_nombre: string;
  fecha_movimiento: string;
}

interface ProductoCombo {
  id: number;
  nombre: string;
  stock: number;
}

export default function InventarioPage() {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productos, setProductos] = useState<ProductoCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movimientosRes, productosRes] = await Promise.all([
        fetch('/api/admin/inventario', { credentials: 'include' }),
        fetch('/api/admin/productos', { credentials: 'include' }),
      ]);

      if (!movimientosRes.ok || !productosRes.ok) {
        setError('No se pudo cargar el historial o los productos.');
        return;
      }

      const [movimientosData, productosData] = await Promise.all([
        movimientosRes.json(),
        productosRes.json(),
      ]);

      setMovimientos(Array.isArray(movimientosData) ? movimientosData : []);
      setProductos(Array.isArray(productosData) ? productosData : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const cantidadNumerica = Number(cantidad);
    if (!selectedProduct || !Number.isInteger(cantidadNumerica) || cantidadNumerica <= 0) {
      setError('Selecciona un producto y especifica una cantidad válida (mayor a 0).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          producto_id: selectedProduct,
          cantidad: cantidadNumerica,
          descripcion,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Error al registrar movimiento.');
        return;
      }

      setSuccess('Entrada de stock registrada correctamente.');
      setSelectedProduct('');
      setCantidad('');
      setDescripcion('');
      loadData();
    } catch (error) {
      console.error(error);
      setError('Error al enviar el movimiento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando movimientos de inventario...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">
              Control de Almacén
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{movimientos.length} movimientos registrados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-violet-400 text-3xl">warehouse</span>
            Historial de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Supervisa entradas manuales, salidas por despachos de pedidos y bitácora de stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Recargar inventario"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-gray-700/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── MENSAJES DE ALERTA ── */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL: TABLA + FORMULARIO DE ENTRADA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Lado izquierdo: Tabla de movimientos */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            Movimientos Recientes
          </h2>

          {movimientos.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">swap_horiz</span>
              <p className="text-gray-300 text-base font-semibold">No hay movimientos registrados</p>
              <p className="text-gray-500 text-xs mt-1">Registra una entrada desde el formulario lateral.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-[#182233] border-b border-gray-800 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Fecha</th>
                      <th className="px-5 py-3.5">Producto</th>
                      <th className="px-5 py-3.5">Tipo</th>
                      <th className="px-5 py-3.5">Cantidad</th>
                      <th className="px-5 py-3.5">Responsable</th>
                      <th className="px-5 py-3.5">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/70 text-sm">
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Fecha */}
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(movimiento.fecha_movimiento).toLocaleString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* Producto */}
                        <td className="px-5 py-3.5 font-semibold text-white whitespace-nowrap group-hover:text-cyan-400 transition-colors">
                          {movimiento.producto_nombre}
                        </td>

                        {/* Tipo de movimiento */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                              movimiento.tipo_movimiento === 'entrada'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {movimiento.tipo_movimiento === 'entrada' ? 'arrow_downward' : 'arrow_upward'}
                            </span>
                            {movimiento.tipo_movimiento}
                          </span>
                        </td>

                        {/* Cantidad */}
                        <td className="px-5 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                          {movimiento.tipo_movimiento === 'entrada' ? `+${movimiento.cantidad}` : `-${movimiento.cantidad}`}
                        </td>

                        {/* Usuario */}
                        <td className="px-5 py-3.5 text-xs text-gray-300 whitespace-nowrap">
                          {movimiento.usuario_nombre}
                        </td>

                        {/* Descripción */}
                        <td className="px-5 py-3.5 text-xs text-gray-400 max-w-[200px] truncate">
                          {movimiento.descripcion || <span className="text-gray-600 italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Lado derecho: Formulario para registrar entrada */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            Registrar Entrada de Stock
          </h2>

          <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Entrada Manual</h3>
                <p className="text-[11px] text-gray-400">Incrementa el stock de un producto existente.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Producto a ingresar
                </label>
                <select
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(Number(event.target.value) || '')}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] text-white px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  <option value="">Selecciona un producto...</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} (Stock actual: {producto.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={cantidad}
                  min={1}
                  placeholder="Ej. 10"
                  onChange={(event) => setCantidad(event.target.value)}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] text-white px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Motivo o descripción
                </label>
                <textarea
                  value={descripcion}
                  placeholder="Ej. Compra a distribuidor, ajuste de inventario..."
                  onChange={(event) => setDescripcion(event.target.value)}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] text-white px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-500"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 text-sm shadow-md shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>{submitting ? 'Registrando...' : 'Registrar Entrada'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
