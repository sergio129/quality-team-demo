'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const links = [
    { href: '/proyectos', label: 'Proyectos' },
    { href: '/incidents', label: 'Incidentes' },
    { href: '/equipos', label: 'Equipos' },
    { href: '/celulas', label: 'Células' },
    { href: '/analistas', label: 'Analistas QA' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-gray-800">Quality Team</span>
          </div>
          <div className="flex gap-6">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    isActive
                      ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600'
                  } transition-colors py-5`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
