'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UseOptimizedAuthReturn {
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isInitialLoading: boolean;
}

/**
 * Hook optimizado para manejo de autenticación que reduce el tiempo de carga inicial
 */
export function useOptimizedAuth(): UseOptimizedAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Verificar si hay datos de sesión en localStorage para carga rápida
    const checkLocalSession = () => {
      try {
        const stored = localStorage.getItem('nextauth.session');
        if (stored) {
          const sessionData = JSON.parse(stored);
          // Si hay datos locales válidos, reducir tiempo de loading
          if (sessionData.expires && new Date(sessionData.expires) > new Date()) {
            setIsInitialLoading(false);
          }
        }
      } catch (error) {
        // Ignorar errores de parsing
      }
    };

    if (!hasCheckedAuth) {
      checkLocalSession();
      setHasCheckedAuth(true);
    }
  }, [hasCheckedAuth]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (status === 'authenticated' || status === 'unauthenticated') {
      setIsInitialLoading(false);
    }
  }, [status, router]);

  // Guardar datos de sesión en localStorage para futuras cargas
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem('nextauth.session', JSON.stringify({
          user: session.user,
          expires: session.expires
        }));
      } catch (error) {
        // Ignorar errores de storage
      }
    }
  }, [session]);

  return {
    session,
    status,
    isInitialLoading: status === 'loading' && isInitialLoading
  };
}

/**
 * Hook para verificar si el usuario tiene un rol específico
 */
export function useRequireRole(requiredRole: string) {
  const { session, status, isInitialLoading } = useOptimizedAuth();
  
  const hasRequiredRole = session?.user?.role === requiredRole;
  const isAuthorized = status === 'authenticated' && hasRequiredRole;
  
  return {
    isAuthorized,
    isLoading: status === 'loading' || isInitialLoading,
    session,
    userRole: session?.user?.role
  };
}

/**
 * Hook para rutas que requieren cualquier autenticación
 */
export function useRequireAuth() {
  return useOptimizedAuth();
}
