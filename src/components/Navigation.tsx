'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import UserProfile from '@/components/auth/UserProfile';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  
  const isQALeader = session?.user?.role === 'QA Leader';
  
  // Define links based on user role
  const getLinks = () => {
    // Common links for all authenticated users
    const commonLinks = [
      { href: '/proyectos', label: 'Proyectos' },
      { href: '/incidents', label: 'Incidentes' },
      { href: '/casos-prueba', label: 'Casos de Prueba' },
    ];
    
    // Admin-only links
    const adminLinks = [
      { href: '/equipos', label: 'Equipos' },
      { href: '/celulas', label: 'Células' },
      { href: '/analistas', label: 'Analistas QA' },
      { href: '/usuarios', label: 'Usuarios' },
    ];
    
    // Dashboard available to all
    const dashboardLink = { href: '/dashboard-metricas', label: 'Métricas y Gráficos' };
    
    return isQALeader 
      ? [...commonLinks, ...adminLinks, dashboardLink] 
      : [...commonLinks, dashboardLink];
  };
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };
  
  // If not authenticated and not on the login page, don't show navigation
  if (status === 'unauthenticated' && pathname !== '/login') {
    return null;
  }
  
  // If on login page, show minimal navigation
  if (pathname === '/login') {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-800">Quality Team</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-xl font-semibold text-gray-800">Quality Team</span>
            </Link>
          </div>
          
          <div className="hidden md:flex gap-6">
            {getLinks().map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
          
          {/* User menu */}
          {session?.user && (
            <UserProfile 
              name={session.user.name || 'Usuario'} 
              email={session.user.email || ''} 
              role={session.user.role || 'Sin rol'} 
            />
          )}
          
          {/* Mobile menu button */}
          <div className="relative md:hidden">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              <span>{session?.user?.name || 'Usuario'}</span>
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={showMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-2 text-xs text-gray-500">
                  {session?.user?.email}
                  <br />
                  <span className="font-medium text-gray-700">{session?.user?.role || 'No role'}</span>
                </div>
                <div className="border-t border-gray-100"></div>
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
