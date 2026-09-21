'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Proyecto {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  descripcion: string | null;
  imagen_url: string;
  tecnologias: string | null;
  orden: number;
  activo: boolean | number;
}

const emptyForm = {
  titulo: '',
  slug: '',
  resumen: '',
  descripcion: '',
  imagen_url: '',
  tecnologias: '',
  orden: 0,
  activo: true,
};

export default function AdminProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [currentProject, setCurrentProject] = useState<Proyecto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/proyectos', { credentials: 'include' });
      if (!response.ok) throw new Error('No fue posible cargar los proyectos');
      const data = await response.json();
      setProyectos(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los proyectos destacados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/proyectos', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('No fue posible cargar los proyectos');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProyectos(Array.isArray(data) ? data : []);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los proyectos destacados.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openNewProject = () => {
    setCurrentProject(null);
    setForm({ ...emptyForm, orden: proyectos.length + 1 });
    setShowEditor(true);
  };

  const openEditor = (project: Proyecto) => {
    setCurrentProject(project);
    setForm({
      titulo: project.titulo,
      slug: project.slug,
      resumen: project.resumen,
      descripcion: project.descripcion || '',
      imagen_url: project.imagen_url,
      tecnologias: project.tecnologias || '',
      orden: Number(project.orden),
      activo: Boolean(project.activo),
    });
    setShowEditor(true);
  };

  const saveProject = async () => {
    if (!form.titulo.trim() || !form.resumen.trim() || !form.imagen_url.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completa el título, el resumen y la URL de la imagen.' });
      return;
    }

    const editing = Boolean(currentProject);
    try {
      const response = await fetch(
        editing ? `/api/admin/proyectos/${currentProject?.id}` : '/api/admin/proyectos',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'No se pudo guardar el proyecto.' });
        return;
      }
      setShowEditor(false);
      await fetchProjects();
      setMensaje({ tipo: 'ok', texto: editing ? 'Proyecto actualizado correctamente.' : 'Proyecto creado correctamente.' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el proyecto.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">sync</span>
        <p className="text-base font-medium">Cargando proyectos destacados...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO DE SECCIÓN ESTILO YOUTUBE STUDIO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
              Portafolio y Vitrina
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{proyectos.length} proyectos registrados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-teal-400 text-3xl">auto_awesome</span>
            Proyectos Destacados
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Administra los trabajos reales y proyectos que se exponen en el carrusel de la página de inicio.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openNewProject}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Nuevo Proyecto</span>
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

      {/* ── TABLA DE PROYECTOS ── */}
      {proyectos.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#141b28] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-2">photo_library</span>
          <p className="text-gray-300 text-base font-semibold">No hay proyectos registrados</p>
          <p className="text-gray-500 text-xs mt-1">Crea un proyecto para destacarlo en la página principal.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800/80 bg-[#141b28] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#182233] border-b border-gray-800 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Proyecto</th>
                  <th className="px-6 py-3.5">Resumen</th>
                  <th className="px-6 py-3.5">Orden</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70 text-sm">
                {proyectos.map((project) => (
                  <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Imagen y Título */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-16 rounded-xl bg-[#0f141f] border border-gray-800 overflow-hidden shrink-0 relative">
                          <Image
                            src={project.imagen_url}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {project.titulo}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">/{project.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Resumen */}
                    <td className="px-6 py-4 text-xs text-gray-300 max-w-sm line-clamp-2">
                      {project.resumen}
                    </td>

                    {/* Orden */}
                    <td className="px-6 py-4 font-mono font-bold text-white text-xs">
                      #{project.orden}
                    </td>

                    {/* Estado Visible */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          Boolean(project.activo)
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-700/40 text-gray-400 border-gray-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${Boolean(project.activo) ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        {Boolean(project.activo) ? 'Visible' : 'Oculto'}
                      </span>
                    </td>

                    {/* Botón Editar */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditor(project)}
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

      {/* ── MODAL EDITOR DE PROYECTO ESTILO YOUTUBE STUDIO ── */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-[#141b28] border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#182233] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <span className="material-symbols-outlined text-2xl">
                    {currentProject ? 'edit_note' : 'add_photo_alternate'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {currentProject ? 'Editar Proyecto Destacado' : 'Nuevo Proyecto'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Se publicará en el carrusel de trabajos de la landing page.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            {/* Campos del formulario */}
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 max-h-[calc(100dvh-12rem)] overflow-y-auto">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Título del Proyecto *</label>
                <input
                  type="text"
                  placeholder="Ej. Fachada Flotante Torre Norte"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Slug URL</label>
                <input
                  type="text"
                  placeholder="fachada-flotante (autogenerado si se omite)"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Resumen Breve (Tarjeta) *</label>
                <input
                  type="text"
                  placeholder="Descripción concisa que aparece en la tarjeta..."
                  value={form.resumen}
                  onChange={(e) => setForm({ ...form, resumen: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descripción Completa</label>
                <textarea
                  placeholder="Explicación detallada del proyecto, materiales utilizados y ubicación..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">URL de la Imagen *</label>
                <input
                  type="text"
                  placeholder="https://... o /proyectos/fachada.jpg"
                  value={form.imagen_url}
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Materiales / Tecnologías</label>
                <input
                  type="text"
                  placeholder="Vidrio Laminado 10mm, Perfilería Serie 70, Herrajes Acero..."
                  value={form.tecnologias}
                  onChange={(e) => setForm({ ...form, tecnologias: e.target.value })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Orden en el Carrusel</label>
                <input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-700/80 bg-[#0f141f] px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-1 flex items-center pt-5">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="h-4 w-4 rounded bg-[#0f141f] border-gray-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-medium text-gray-200">Publicar y mostrar en la web</span>
                </label>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex justify-end gap-2.5 border-t border-gray-800 bg-[#182233] px-6 py-4">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveProject}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all"
              >
                {currentProject ? 'Guardar Cambios' : 'Publicar Proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
