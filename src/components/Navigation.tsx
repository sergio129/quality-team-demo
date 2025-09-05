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
        
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between relative">
          {/* Background glassmorphism effect */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          
          <div className="flex items-center relative z-10">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative bg-white p-2 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                <span className="text-lg">🔍</span>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">
                  Quality Team
                </span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg relative z-10">
            {getLinks().map((link, index) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-lg transform scale-105'
                      : 'text-white/90 hover:text-white hover:bg-white/20 hover:shadow-md hover:scale-102'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className={`text-lg transition-transform duration-300 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`}>
                      {index === 0 && '📋'}
                      {index === 1 && '🔥'}
                      {index === 2 && '✅'}
                      {index === 3 && '👥'}
                      {index === 4 && '🏢'}
                      {index === 5 && '👨‍💻'}
                      {index === 6 && '👤'}
                      {index === 7 && '📊'}
                    </span>
                    <span>{link.label}</span>
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-700 rounded-full shadow-sm animate-pulse"></div>
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200/0 via-white/5 to-blue-200/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* User menu - Diferente comportamiento para móvil y desktop */}
          {session?.user && (
            <div className="relative z-10">
              <UserProfile 
                name={session.user.name || 'Usuario'} 
                email={session.user.email || ''} 
                role={session.user.role || 'Sin rol'} 
              />
            </div>
          )}
          
          {/* Mobile menu button - Solo visible en móvil cuando no hay espacio para UserProfile */}
          <div className="relative md:hidden z-10 hidden">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 text-white/90 hover:text-white bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <span className="text-sm font-medium">{session?.user?.name || 'Usuario'}</span>
              <svg 
                className="w-4 h-4 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute -right-4 sm:right-0 mt-3 w-[95vw] sm:w-64 max-w-sm bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {(session?.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.name || 'Usuario'}</p>
                      <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full mt-1">
                        {session?.user?.role || 'Sin rol'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Navigation Links */}
                <div className="py-2">
                  {getLinks().map((link, index) => {
                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setShowMenu(false)}
                        className={`flex items-center space-x-3 px-4 py-3 text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                        }`}
                      >
                        <span className="text-lg">
                          {index === 0 && '📋'}
                          {index === 1 && '🔥'}
                          {index === 2 && '✅'}
                          {index === 3 && '👥'}
                          {index === 4 && '🏢'}
                          {index === 5 && '👨‍💻'}
                          {index === 6 && '👤'}
                          {index === 7 && '📊'}
                        </span>
                        <span className="font-medium">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
                
                {/* Sign Out Section */}
                <div className="border-t border-gray-100 pt-2">
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
