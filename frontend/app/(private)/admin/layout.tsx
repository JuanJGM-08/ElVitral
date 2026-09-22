'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Principal', href: '/admin', icon: 'dashboard', exact: true },
  { name: 'Usuarios', href: '/admin/usuarios', icon: 'group' },
  { name: 'Productos', href: '/admin/productos', icon: 'inventory_2' },
  { name: 'Inventario', href: '/admin/inventario', icon: 'warehouse' },
  { name: 'Cotizaciones', href: '/admin/cotizaciones', icon: 'request_quote' },
  { name: 'Pedidos', href: '/admin/pedidos', icon: 'local_shipping' },
  { name: 'Agenda', href: '/admin/agenda', icon: 'calendar_month' },
  { name: 'Proyectos', href: '/admin/proyectos', icon: 'auto_awesome' },
];

const secondaryLinks = [
  { name: 'Ver Tienda', href: '/', icon: 'storefront' },
  { name: 'Catálogo', href: '/catalogo', icon: 'category' },
  { name: 'Cotizador', href: '/cotizar', icon: 'calculate' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuth();

  // Estados de navegación estilo YouTube
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar preferencia del sidebar guardada
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignorar errores en navegadores con almacenamiento restringido
    }
  }, []);

  // Alternar sidebar y persistir preferencia
  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setIsCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('admin_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Manejar cierre de sesión
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error(e);
    }
    clearUser();
    router.push('/');
    router.refresh();
  }, [clearUser, router]);

  // Manejar búsqueda / filtro rápido de secciones
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const term = searchQuery.toLowerCase().trim();
    const matched = navItems.find(
      item => item.name.toLowerCase().includes(term) || item.href.toLowerCase().includes(term)
    );
    if (matched) {
      router.push(matched.href);
      setSearchQuery('');
    }
  };

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  };

  const userInitial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── BARRA SUPERIOR (HEADER ESTILO YOUTUBE PC) ── */}
      <header className="sticky top-0 z-40 h-14 bg-[#0f0f0f] border-b border-[#272727] px-3 sm:px-4 flex items-center justify-between gap-2 select-none">
        {/* Lado izquierdo: Botón Hamburguesa + Logo */}
        <div className="flex items-center gap-3 min-w-fit">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Alternar barra lateral"
            className="p-2 rounded-full text-gray-200 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <Link href="/admin" className="flex items-center gap-2 group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg bg-[#1a2233] p-1 border border-gray-800 group-hover:border-cyan-500/50 transition-colors">
              <Image
                src="/logo.jpeg"
                alt="El Vitral Logo"
                width={85}
                height={28}
                className="h-6 w-auto object-contain rounded"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight hidden sm:inline-block group-hover:text-cyan-400 transition-colors">
                El Vitral
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 shadow-xs">
                ADMIN
              </span>
            </div>
          </Link>
        </div>

        {/* Centro: Barra de búsqueda estilo YouTube */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-4">
          <div className="flex items-center w-full max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar sección (ej. productos, usuarios)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-[#303030] focus:border-cyan-500 rounded-l-full py-1.5 px-4 text-xs lg:text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              aria-label="Buscar"
              className="bg-[#222222] hover:bg-[#272727] active:bg-[#333333] border border-l-0 border-[#303030] rounded-r-full px-5 py-1.5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          </div>
        </form>

        {/* Lado derecho: Accesos rápidos, usuario y logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botón Ver Tienda Pública */}
          <Link
            href="/"
            title="Ir a la tienda pública"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-full border border-gray-700/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-cyan-400">storefront</span>
            <span className="hidden sm:inline">Ver Tienda</span>
          </Link>

          {/* Acceso rápido a Cotizaciones */}
          <Link
            href="/admin/cotizaciones"
            title="Ver Cotizaciones"
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors relative"
          >
            <span className="material-symbols-outlined text-[22px]">request_quote</span>
          </Link>

          {/* Badge del Usuario Administrador */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-gray-800">
            <div
              className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-cyan-500/30"
              title={user?.email || 'Administrador'}
            >
              {userInitial}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-white max-w-[110px] truncate">
                {user?.nombre || 'Administrador'}
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">Panel Admin</span>
            </div>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 rounded-full text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {/* ── CONTENEDOR CENTRAL: SIDEBAR + CONTENIDO ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── SIDEBAR DESKTOP (YOUTUBE PC ESTILO EXPANDIDO O MINI) ── */}
        <aside
          className={`hidden md:flex flex-col justify-between shrink-0 bg-[#0f0f0f] border-r border-[#272727] select-none transition-[width] duration-200 ease-in-out ${
            isCollapsed ? 'w-[72px]' : 'w-60'
          }`}
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          <div className="flex-1 overflow-y-auto py-2.5 overflow-x-hidden">
            {/* Si está colapsado: Renderizado estilo Mini Sidebar de YouTube PC (Icono arriba + texto compacto abajo) */}
            {isCollapsed ? (
              <nav className="flex flex-col gap-1 px-1">
                {navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.name}
                      className={`flex flex-col items-center justify-center py-3.5 px-1 rounded-xl text-center transition-colors group ${
                        active
                          ? 'bg-[#272727] text-white font-semibold'
                          : 'text-gray-400 hover:bg-[#272727]/60 hover:text-white'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[24px] group-hover:scale-105 transition-transform ${
                          active ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-200'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="text-[10px] tracking-tight truncate max-w-[62px] mt-1 font-normal leading-none">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-[#272727] mx-2" />

                {/* Accesos secundarios en modo mini */}
                <Link
                  href="/"
                  title="Ver Tienda"
                  className="flex flex-col items-center justify-center py-3 px-1 rounded-xl text-center text-gray-400 hover:bg-[#272727]/60 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px] text-gray-400">storefront</span>
                  <span className="text-[10px] mt-1 font-normal leading-none">Tienda</span>
                </Link>
              </nav>
            ) : (
              /* Si está expandido: Renderizado estilo Sidebar Expandido de YouTube PC (Fila horizontal con icono y etiqueta) */
              <nav className="flex flex-col gap-0.5 px-3">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Módulos de Gestión
                </div>

                {navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                        active
                          ? 'bg-[#272727] text-white font-semibold shadow-xs'
                          : 'text-gray-300 hover:bg-[#272727]/70 hover:text-white'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[22px] group-hover:scale-105 transition-transform ${
                          active ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-200'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}

                <div className="my-3 border-t border-[#272727]" />

                <div className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Accesos Directos
                </div>

                {secondaryLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-[#272727]/60 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-gray-400">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Footer del sidebar (solo en modo expandido) */}
          {!isCollapsed && (
            <div className="p-3 border-t border-[#272727] text-[11px] text-gray-500 leading-tight">
              <p className="font-semibold text-gray-400">El Vitral Studio v2.0</p>
              <p className="mt-0.5">Panel administrativo central</p>
            </div>
          )}
        </aside>

        {/* ── SIDEBAR MÓVIL (OFF-CANVAS DRAWER) ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop oscuro */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel lateral deslizante */}
            <div className="relative w-64 max-w-[80vw] bg-[#0f0f0f] border-r border-[#272727] p-3 flex flex-col justify-between shadow-2xl z-10">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#272727] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">El Vitral</span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
                      ADMIN
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          active
                            ? 'bg-[#272727] text-white font-semibold'
                            : 'text-gray-300 hover:bg-[#272727]/60 hover:text-white'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[22px] ${
                            active ? 'text-cyan-400' : 'text-gray-400'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-[#272727]">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px] text-cyan-400">storefront</span>
                  <span>Ver Tienda</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ÁREA PRINCIPAL DE CONTENIDO (RESTO DE LA PANTALLA) ── */}
        <main
          className="flex-1 min-w-0 overflow-y-auto bg-[#0b0f17] text-gray-100"
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
