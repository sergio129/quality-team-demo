'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

interface UseOptimizedAuthReturn {
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isInitialLoading: boolean;
}

// Configuración del timeout de inactividad
const INACTIVITY_TIMEOUT_MINUTES = 1;
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
const WARNING_TIME_MS = 30 * 1000; // 30 segundos antes del cierre

/**
 * Hook optimizado para manejo de autenticación que reduce el tiempo de carga inicial
 * Incluye timeout de inactividad de 1 minuto con advertencia 30 segundos antes
 */
export function useOptimizedAuth(): UseOptimizedAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Función para resetear el timer de inactividad
  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Limpiar timers existentes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Timer para mostrar advertencia 30 segundos antes
    warningTimerRef.current = setTimeout(() => {
      toast.warning('⚠️ Tu sesión se cerrará en 30 segundos por inactividad', {
        duration: 30000, // Mostrar por 30 segundos
        action: {
          label: 'Mantener sesión',
          onClick: () => resetInactivityTimer(),
        },
      });
    }, INACTIVITY_TIMEOUT_MS - WARNING_TIME_MS);
    
    // Timer para cerrar sesión
    inactivityTimerRef.current = setTimeout(() => {
      signOut({ callbackUrl: '/login?reason=inactive' });
    }, INACTIVITY_TIMEOUT_MS);
  };

  // Configurar event listeners para actividad
  useEffect(() => {
    if (status === 'authenticated') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => resetInactivityTimer();
      
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });
      
      // Iniciar timer inicial
      resetInactivityTimer();
      
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
      };
    }
  }, [status]);

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
