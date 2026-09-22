'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [stats, setStats] = useState({
    usuarios: 0,
    productos: 0,
    cotizaciones: 0,
    pedidos: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/usuarios', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/productos', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/cotizaciones', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/pedidos', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
    ])
      .then(([usuarios, productos, cotizaciones, pedidos]) => {
        setStats({
          usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
          productos: Array.isArray(productos) ? productos.length : 0,
          cotizaciones: Array.isArray(cotizaciones) ? cotizaciones.length : 0,
          pedidos: Array.isArray(pedidos) ? pedidos.length : 0
        });
      })
      .catch(() => {
        router.push('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const statCards = [
    {
      title: 'Usuarios',
      count: stats.usuarios,
      href: '/admin/usuarios',
      icon: 'group',
      color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30 text-blue-400',
      description: 'Cuentas registradas',
    },
    {
      title: 'Productos',
      count: stats.productos,
      href: '/admin/productos',
      icon: 'inventory_2',
      color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
      description: 'En catálogo activo',
    },
    {
      title: 'Cotizaciones',
      count: stats.cotizaciones,
      href: '/admin/cotizaciones',
      icon: 'request_quote',
      color: 'from-amber-600/20 to-yellow-600/10 border-amber-500/30 text-amber-400',
      description: 'Solicitudes recibidas',
    },
    {
      title: 'Pedidos',
      count: stats.pedidos,
      href: '/admin/pedidos',
      icon: 'local_shipping',
      color: 'from-purple-600/20 to-indigo-600/10 border-purple-500/30 text-purple-400',
      description: 'Órdenes de clientes',
    },
  ];

  const modules = [
    {
      title: 'Gestión de Usuarios',
      desc: 'Ver, autorizar roles, activar cuentas y revisar accesos.',
      href: '/admin/usuarios',
      icon: 'group',
      accent: 'border-l-cyan-500 text-cyan-400',
      badge: 'Control de acceso',
    },
    {
      title: 'Gestión de Productos',
      desc: 'Crear, editar, ajustar precios, variantes y visibilidad.',
      href: '/admin/productos',
      icon: 'inventory_2',
      accent: 'border-l-emerald-500 text-emerald-400',
      badge: 'Catálogo',
    },
    {
      title: 'Historial de Inventario',
      desc: 'Control de existencias, entradas de stock y bitácora de movimientos.',
      href: '/admin/inventario',
      icon: 'warehouse',
      accent: 'border-l-violet-500 text-violet-400',
      badge: 'Almacén',
    },
    {
      title: 'Cotizaciones',
      desc: 'Listado de cotizaciones, desglose de medidas y generación de PDF.',
      href: '/admin/cotizaciones',
      icon: 'request_quote',
      accent: 'border-l-amber-500 text-amber-400',
      badge: 'Presupuestos',
    },
    {
      title: 'Pedidos y Entregas',
      desc: 'Supervisar pagos de Stripe, seguimiento y estados de despacho.',
      href: '/admin/pedidos',
      icon: 'local_shipping',
      accent: 'border-l-sky-500 text-sky-400',
      badge: 'Ventas',
    },
    {
      title: 'Agenda de Citas',
      desc: 'Gestionar citas de instalación, visitas técnicas y días disponibles.',
      href: '/admin/agenda',
      icon: 'calendar_month',
      accent: 'border-l-rose-500 text-rose-400',
      badge: 'Calendario',
    },
    {
      title: 'Proyectos Destacados',
      desc: 'Publicar y actualizar trabajos destacados en la página de inicio.',
      href: '/admin/proyectos',
      icon: 'auto_awesome',
      accent: 'border-l-teal-500 text-teal-400',
      badge: 'Portafolio',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── BANNER PRINCIPAL DE BIENVENIDA ESTILO YOUTUBE STUDIO ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#182234] via-[#141b2b] to-[#0f141f] border border-gray-800/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Panel de Control Activo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido al Panel de Administración
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Supervisa en tiempo real las métricas comerciales, gestiona tu catálogo, agenda de citas y pedidos desde una sola interfaz.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-gray-700 transition-all hover:scale-102"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span>Visitar Sitio Web</span>
            </Link>
          </div>
        </div>

        {/* Efecto de resplandor sutil de fondo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── TARJETAS DE MÉTRICAS RÁPIDAS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-200 tracking-wide uppercase text-xs">
            Resumen General
          </h2>
          {loading && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              Actualizando datos...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl bg-[#161d2b]/80 hover:bg-[#1b2436] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${card.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {card.title}
                </span>
                <span className="material-symbols-outlined text-2xl opacity-80 group-hover:scale-110 transition-transform">
                  {card.icon}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? '—' : card.count}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CUADRÍCULA DE MÓDULOS DE GESTIÓN (ESTILO YOUTUBE STUDIO CARDS) ── */}
      <div>
        <h2 className="text-base font-bold text-gray-200 tracking-wide uppercase text-xs mb-4">
          Módulos de Gestión
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group relative rounded-2xl bg-[#141b28] hover:bg-[#192233] border border-gray-800/80 p-5 transition-all duration-200 border-l-4 hover:border-gray-700 shadow-sm hover:shadow-md ${mod.accent}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">{mod.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {mod.badge}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {mod.title}
                    </h3>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all text-xl">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {mod.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
