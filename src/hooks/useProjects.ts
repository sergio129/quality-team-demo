'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';
import { Project } from '@/models/Project';

// API endpoints
const PROJECTS_API = '/api/projects';
const PROJECTS_STATUS_API = '/api/projects/status';

// Tipo para estadísticas de proyectos
export interface ProjectStats {
  totalPorEquipo: Record<string, number>;
  totalPorEstado: {
    'Por Iniciar': number;
    'En Progreso': number;
    'Certificado': number;
  };
  totalActivos: number;
}

// Tipo para respuesta paginada
export interface PaginatedProjectsResponse {
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Opciones para filtros y paginación
export interface UseProjectsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  teamFilter?: string;
  statusFilter?: string;
  analystFilter?: string;
  monthFilter?: number;
  yearFilter?: number;
}

/**
 * Hook para obtener proyectos con paginación y filtros
 */
export function useProjects(options: UseProjectsOptions = {}) {
  // Obtener la sesión del usuario
  const { data: session } = useSWR('/api/auth/session', fetcher);
  
  // Construir la URL con los parámetros del usuario actual y filtros
  const urlKey = useMemo(() => {
    // Si no tenemos sesión, retornamos null para evitar la petición
    if (!session?.user) return null;
    
    let url = PROJECTS_API;
    const params = new URLSearchParams();
    
    // Añadir parámetros de role y analystId
    if (session.user.role) {
      params.append('role', session.user.role);
    }
    
    if (session.user.analystId) {
      params.append('analystId', session.user.analystId);
    }
    
    // Añadir parámetros de paginación
    if (options.page) {
      params.append('page', options.page.toString());
    }
    
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    // Añadir parámetros de filtros
    if (options.searchTerm) {
      params.append('search', options.searchTerm);
    }
    
    if (options.teamFilter) {
      params.append('team', options.teamFilter);
    }
    
    if (options.statusFilter) {
      params.append('status', options.statusFilter);
    }
    
    if (options.analystFilter) {
      params.append('analyst', options.analystFilter);
    }
    
    if (options.monthFilter) {
      params.append('month', options.monthFilter.toString());
    }
    
    if (options.yearFilter) {
      params.append('year', options.yearFilter.toString());
    }
    
    // Construir URL final con parámetros
    url = `${PROJECTS_API}?${params.toString()}`;
    return url;
  }, [session, options]); // Dependencias actualizadas para incluir options
  
  // Usar una clave estable para SWR
  const { data, error, isLoading } = useSWR<PaginatedProjectsResponse>(
    urlKey, // Solo hace la petición si urlKey no es null
    fetcher,
    { 
      revalidateOnFocus: false, // Cache HTTP se encarga de revalidación
      revalidateOnReconnect: true, // Revalidar en reconexiones
      dedupingInterval: 60000, // 1 minuto para deduplicar peticiones
      focusThrottleInterval: 30000, // Throttle focus revalidation
      errorRetryInterval: 5000, // Intervalo entre reintentos
      errorRetryCount: 3, // Más reintentos
      keepPreviousData: true, // Mantener datos anteriores durante revalidación
      refreshInterval: 0 // Desactivar refresh automático, confiar en cache HTTP
    }
  );

  return {
    projects: data?.data || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    },
    isLoading: isLoading || !session, // Considerar loading si la sesión no está cargada
    isError: error,
  };
}

/**
 * Hook para obtener TODOS los proyectos sin paginación (para vistas especiales como Timeline)
 */
export function useAllProjects(options: Omit<UseProjectsOptions, 'page' | 'limit'> = {}) {
  // Obtener la sesión del usuario
  const { data: session } = useSWR('/api/auth/session', fetcher);
  
  // Construir la URL con los parámetros del usuario actual y filtros (sin paginación y sin filtros de fecha)
  const urlKey = useMemo(() => {
    // Si no tenemos sesión, retornamos null para evitar la petición
    if (!session?.user) return null;
    
    let url = PROJECTS_API;
    const params = new URLSearchParams();
    
    // Añadir parámetros de role y analystId
    if (session.user.role) {
      params.append('role', session.user.role);
    }
    
    if (session.user.analystId) {
      params.append('analystId', session.user.analystId);
    }
    
    // Para obtener todos los proyectos, establecer un límite alto
    params.append('limit', '1000');
    params.append('page', '1');
    
    // Añadir filtros básicos (sin fecha para permitir que Timeline maneje el filtrado)
    if (options.searchTerm) {
      params.append('search', options.searchTerm);
    }
    
    if (options.teamFilter) {
      params.append('team', options.teamFilter);
    }
    
    if (options.statusFilter) {
      params.append('status', options.statusFilter);
    }
    
    if (options.analystFilter) {
      params.append('analyst', options.analystFilter);
    }
    
    // NO añadir filtros de fecha - dejar que Timeline los maneje
    
    // Construir URL final con parámetros
    url = `${PROJECTS_API}?${params.toString()}`;
    return url;
  }, [session, options]);
  
  // Usar una clave estable para SWR
  const { data, error, isLoading } = useSWR<PaginatedProjectsResponse>(
    urlKey,
    fetcher,
    { 
      revalidateOnFocus: false, // Cache HTTP maneja revalidación
      revalidateOnReconnect: true,
      dedupingInterval: 120000, // 2 minutos - datos más estables para timeline
      focusThrottleInterval: 60000, // 1 minuto throttle para timeline
      errorRetryInterval: 5000,
      errorRetryCount: 3,
      keepPreviousData: true, // Importante para timeline - evita flickering
      refreshInterval: 0 // Sin refresh automático, confiar en cache HTTP
    }
  );

  return {
    projects: data?.data || [],
    isLoading: isLoading || !session,
    isError: error,
  };
}

/**
 * Hook para obtener estadísticas de proyectos
 */
export function useProjectStats() {
  const { data, error, isLoading } = useSWR<ProjectStats>(
    PROJECTS_STATUS_API, 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutos - estadísticas cambian poco
      focusThrottleInterval: 120000, // 2 minutos throttle
      errorRetryInterval: 10000,
      errorRetryCount: 2,
      refreshInterval: 0 // Cache HTTP maneja revalidación
    }
  );

  return {
    stats: data || {
      totalPorEquipo: {},
      totalPorEstado: { 'Por Iniciar': 0, 'En Progreso': 0, 'Certificado': 0 },
      totalActivos: 0
    },
    isLoading,
    isError: error,
  };
}

/**
 * Función para crear un nuevo proyecto
 */
export async function createProject(project: Partial<Project>) {
  return toast.promise(
    async () => {
      const response = await fetch(PROJECTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el proyecto');
      }

      const result = await response.json();
      
      // Revalidar la caché de proyectos (todas las páginas)
      mutate(key => typeof key === 'string' && key.startsWith(PROJECTS_API), undefined, { revalidate: true });
      mutate(PROJECTS_STATUS_API);
      
      // Revalidar la caché de planes de prueba, ya que se crea uno automáticamente
      mutate('/api/test-plans');
      if (project.idJira) {
        mutate(`/api/test-plans?projectId=${project.idJira}`);
      }
      
      // Mostrar mensaje más descriptivo si se creó un plan de prueba
      if (result.testPlan) {
        toast.success('Se ha creado automáticamente un plan de pruebas para este proyecto', {
          duration: 5000 // Mostrar el mensaje por 5 segundos
        });
      }
      
      return result.project || result;
    },
    {
      loading: 'Creando proyecto...',
      success: 'Proyecto creado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar un proyecto existente
 */
export async function updateProject(id: string, project: Partial<Project>) {
  return toast.promise(
    async () => {
      const response = await fetch(PROJECTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, project }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el proyecto');
      }

      const updatedProject = await response.json();
      
      // Revalidar la caché (todas las páginas de proyectos)
      mutate(key => typeof key === 'string' && key.startsWith(PROJECTS_API), undefined, { revalidate: true });
      mutate(`${PROJECTS_API}/${id}`);
      mutate(PROJECTS_STATUS_API);
      
      return updatedProject;
    },
    {
      loading: 'Actualizando proyecto...',
      success: 'Proyecto actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para cambiar el estado de un proyecto
 */
export async function changeProjectStatus(id: string, nuevoEstado: string, idJira?: string) {
  // Si no se proporciona idJira, asumimos que id es idJira (para mantener compatibilidad)
  const projectIdJira = idJira || id;
  
  // Ajustar la fecha de certificación si el nuevo estado es "Certificado"
  let updates: any = {
    estado: nuevoEstado,
    estadoCalculado: nuevoEstado
  };
  
  // Si el estado es Certificado, actualizamos la fecha de certificación
  if (nuevoEstado === 'Certificado') {
    updates.fechaCertificacion = new Date();
  }
  
  return toast.promise(
    async () => {
      // Optimistic update - actualiza inmediatamente la caché SWR antes de enviar la solicitud
      const currentCacheKeys = Array.from(document.querySelectorAll('*')).map(() => 
        Array.from(new Set([...document.querySelectorAll('*')]))
      );
      
      // Enviar la solicitud real al servidor - Estructura plana con todos los campos de actualización
      const response = await fetch(PROJECTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idJira: projectIdJira,
          ...updates
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al cambiar el estado del proyecto');
      }

      const updatedProject = await response.json();
      
      // Revalidar la caché con los datos reales del servidor (todas las páginas)
      mutate(key => typeof key === 'string' && key.startsWith(PROJECTS_API), undefined, { revalidate: true });
      mutate(`${PROJECTS_API}/${id}`);
      mutate(PROJECTS_STATUS_API);
      
      return updatedProject;
    },
    {
      loading: 'Cambiando estado...',
      success: 'Estado actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un proyecto
 */
export async function deleteProject(id: string) {
  return toast.promise(
    async () => {
      const response = await fetch(PROJECTS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idJira: id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el proyecto');
      }
      
      // Revalidar la caché (todas las páginas)
      mutate(key => typeof key === 'string' && key.startsWith(PROJECTS_API), undefined, { revalidate: true });
      mutate(PROJECTS_STATUS_API);
      
      return true;
    },
    {
      loading: 'Eliminando proyecto...',
      success: 'Proyecto eliminado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}
