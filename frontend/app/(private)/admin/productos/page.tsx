'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_url?: string;
  tipo: string;
  unidad_medida: string;
  precio_base: number;
  stock: number;
  activo: boolean;
}

const tipos = ['vidrio', 'espejo', 'aluminio', 'herraje', 'insumo'];

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Producto | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filterType, setFilterType] = useState('todos');
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'vidrio',
    unidad_medida: '',
    precio_base: 0,
    imagen_url: '',
    stock: 0,
    activo: true,
  });

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/admin/productos', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.error || `${res.status} ${res.statusText}`;
        setError(`No autorizado: ${message}`);
        setProductos([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setError('Datos de productos inválidos');
        setProductos([]);
        return;
      }

      setProductos(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const openEditor = (producto: Producto) => {
    setCurrentProduct(producto);
    setConfirmDelete(false);
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      tipo: producto.tipo,
      unidad_medida: producto.unidad_medida,
      precio_base: producto.precio_base,
      imagen_url: producto.imagen_url || '',
      stock: producto.stock,
      activo: producto.activo,
    });
    setShowModal(true);
  };

  const openCreator = () => {
    setCurrentProduct(null);
    setConfirmDelete(false);
    setForm({
      nombre: '',
      descripcion: '',
      tipo: 'vidrio',
      unidad_medida: '',
      precio_base: 0,
      imagen_url: '',
      stock: 0,
      activo: true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentProduct(null);
    setConfirmDelete(false);
  };

  const saveProduct = async () => {
    const isEditing = Boolean(currentProduct);

    try {
      const url = isEditing ? `/api/admin/productos/${currentProduct?.id}` : '/api/admin/productos';
      const method = isEditing ? 'PATCH' : 'POST';
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        tipo: form.tipo,
        unidad_medida: form.unidad_medida,
        precio_base: form.precio_base,
        imagen_url: form.imagen_url,
        stock: form.stock,
        activo: form.activo,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMensaje({ tipo: 'error', texto: data?.error || (isEditing ? 'Error al actualizar el producto' : 'Error al crear el producto') });
        return;
      }

      fetchProductos();
      closeModal();
      setMensaje({ tipo: 'ok', texto: isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: isEditing ? 'Error al guardar el producto' : 'Error al crear el producto' });
    }
  };

  const deleteProduct = async () => {
    if (!currentProduct) return;

    try {
      const res = await fetch(`/api/admin/productos/${currentProduct.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMensaje({ tipo: 'error', texto: data?.error || 'Error al eliminar el producto' });
        return;
      }

      fetchProductos();
      closeModal();
      setMensaje({ tipo: 'ok', texto: 'Producto eliminado correctamente' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al eliminar el producto' });
    }
  };

  const filteredProducts = filterType === 'todos'
    ? productos
    : productos.filter(p => p.tipo.toLowerCase() === filterType.toLowerCase());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando catálogo de productos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Catálogo de Materiales
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{productos.length} items registrados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">inventory_2</span>
            Gestión de Productos
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Administra los precios base, existencias y disponibilidad de vidrios, aluminios y herrajes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProductos}
            title="Recargar catálogo"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-gray-700/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={openCreator}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Nuevo Producto</span>
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

      {/* ── BARRA DE FILTROS POR TIPO (ESTILO CHIPS DE YOUTUBE) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-gray-400 font-medium mr-1 shrink-0">Filtrar:</span>
        {['todos', ...tipos].map((t) => {
          const active = filterType === t;
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                active
                  ? 'bg-cyan-500 text-black shadow-xs font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-800'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* ── TABLA DE PRODUCTOS CON DISEÑO MODERNO ── */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">category</span>
          <p className="text-gray-300 text-base font-semibold">No se encontraron productos</p>
          <p className="text-gray-500 text-xs mt-1">Crea un nuevo producto para comenzar o cambia el filtro.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#182233] border-b border-gray-800 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Producto</th>
                  <th className="px-6 py-3.5">Categoría</th>
                  <th className="px-6 py-3.5">Precio Base</th>
                  <th className="px-6 py-3.5">Stock</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70 text-sm">
                {filteredProducts.map((producto) => (
                  <tr
                    key={producto.id}
                    className={`hover:bg-white/[0.02] transition-colors group ${
                      !producto.activo ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Imagen y Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-[#0f141f] border border-gray-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {producto.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={producto.imagen_url}
                              alt={producto.nombre}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-gray-600 text-2xl">image</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {producto.nombre}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                            {producto.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Tipo / Categoría */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-gray-700/60 capitalize">
                        {producto.tipo}
                      </span>
                    </td>

                    {/* Precio Base */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white text-sm">
                        ${Number(producto.precio_base || 0).toLocaleString('es-CO')} COP
                      </div>
                      <span className="text-[11px] text-gray-400">por {producto.unidad_medida || 'unidad'}</span>
                    </td>

                    {/* Stock con indicador */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-lg border ${
                          producto.stock > 10
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : producto.stock > 0
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {producto.stock > 10 ? 'check' : producto.stock > 0 ? 'priority_high' : 'close'}
                        </span>
                        {producto.stock} en existencia
                      </span>
                    </td>

                    {/* Estado Activo */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          producto.activo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-700/40 text-gray-400 border-gray-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${producto.activo ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        {producto.activo ? 'Público' : 'Desactivado'}
                      </span>
                    </td>

                    {/* Botón Editar */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditor(producto)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-400 border border-gray-700/80 hover:border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL DE CREACIÓN / EDICIÓN ESTILO YOUTUBE STUDIO ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl bg-[#141b28] border border-gray-800 flex flex-col max-h-[calc(100dvh-2rem)] my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0 bg-[#182233]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <span className="material-symbols-outlined text-2xl">
                    {currentProduct ? 'edit_note' : 'add_box'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {currentProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {currentProduct
                      ? 'Actualiza las propiedades, precio y estado del artículo.'
                      : 'Completa las especificaciones para publicarlo en catálogo.'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Formulario */}
            <div className="px-6 py-5 grid gap-4 sm:grid-cols-2 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  placeholder="Ej. Vidrio Templado 8mm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Tipo / Categoría</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white capitalize focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descripción</label>
                <textarea
                  placeholder="Detalles y usos recomendados del producto..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Unidad de Medida</label>
                <input
                  type="text"
                  placeholder="m2, metro lineal, unidad..."
                  value={form.unidad_medida}
                  onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Precio Base (COP)</label>
                <input
                  type="number"
                  value={form.precio_base}
                  onChange={(e) => setForm({ ...form, precio_base: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Stock Inicial</label>
                <input
                  type="number"
                  value={form.stock}
                  readOnly={Boolean(currentProduct)}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className={`w-full rounded-xl border border-gray-700/80 px-3.5 py-2 text-sm font-mono ${
                    currentProduct
                      ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed'
                      : 'bg-[#0f141f] text-white focus:outline-none focus:border-cyan-500'
                  }`}
                />
                {currentProduct && (
                  <p className="text-[11px] text-gray-500 mt-1">El stock se actualiza en el módulo de Inventario.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">URL de Imagen</label>
                <input
                  type="text"
                  placeholder="https://... o /ruta/imagen.jpg"
                  value={form.imagen_url}
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="sm:col-span-2 pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="h-4 w-4 rounded bg-[#0f141f] border-gray-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm font-medium text-gray-200">Producto activo y visible en el catálogo público</span>
                </label>
              </div>
            </div>

            {/* Barra de acciones inferior */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-800 px-6 py-4 bg-[#182233] shrink-0">
              {currentProduct && (
                confirmDelete ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-rose-300">¿Confirmas eliminar?</span>
                    <button
                      onClick={deleteProduct}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    Eliminar Producto
                  </button>
                )
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end ml-auto">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/80 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProduct}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all cursor-pointer"
                >
                  {currentProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
