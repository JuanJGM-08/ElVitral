'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        setIsLoggedIn(res.ok);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const handleMisCotizacionesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <footer style={{ backgroundColor: '#0f1419' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold text-lg mb-4">El Vitral</h3>
            <p className="text-gray-400 text-sm">
              Especialistas en soluciones de vidrio, espejos y herrajes para tu hogar y negocio.
            </p>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Teléfono:</strong> 3137928483
            </p>
          </div>

          {}
          <div>
            <h4 className="text-white font-semibold mb-4">Productos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo?tipo=vidrio" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Vidrio
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=espejo" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Espejos
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=aluminio" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Aluminio
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=herraje" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Herrajes
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Ver catálogo completo
                </Link>
              </li>
            </ul>
          </div>

          {}
          <div>
            <h4 className="text-white font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/cotizar" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Cotizar
                </Link>
              </li>
              <li>
                <Link href="/proyectos" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Proyectos
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Sobre nosotros
                </Link>
              </li>
            </ul>
          </div>

          {}
          <div>
            <h4 className="text-white font-semibold mb-4">Cuenta</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/perfil" className="text-gray-400 hover:text-primary text-sm transition-colors">
                  Mi perfil
                </Link>
              </li>
              <li>
                <a 
                  href={isLoggedIn ? "/cotizaciones" : "#"}
                  onClick={handleMisCotizacionesClick}
                  className="text-gray-400 hover:text-primary text-sm transition-colors"
                >
                  Mis cotizaciones
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="pt-8">
          <div className="flex items-center justify-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} El Vitral. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
