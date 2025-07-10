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

/**
 * Hook para obtener todos los proyectos, aplicando filtros basados en el rol del usuario
 */
export function useProjects() {
  // Obtener la sesión del usuario
  const { data: session } = useSWR('/api/auth/session', fetcher);
  
  // Construir la URL con los parámetros del usuario actual si están disponibles
  const urlKey = useMemo(() => {
    // Si no tenemos sesión, retornamos null para evitar la petición
    if (!session?.user) return null;
    
    let url = PROJECTS_API;
    const params = new URLSearchParams();
    
    // Añadir parámetros de role
    if (session.user.role) {
      params.append('role', session.user.role);
    }
    
    // Añadir analystId si existe
    if (session.user.analystId) {
      params.append('analystId', session.user.analystId);
    }
    
    // No añadir timestamp para evitar ciclos infinitos de revalidación
    // params.append('_t', Date.now().toString());
    
    // Construir URL final con parámetros
    url = `${PROJECTS_API}?${params.toString()}`;
    return url;
  }, [session]); // Dependencia en session para recalcular cuando cambie
  
  // Usar una clave estable para SWR
  const { data, error, isLoading } = useSWR<Project[]>(
    urlKey, // Solo hace la petición si urlKey no es null
    fetcher,
    { 
      revalidateOnFocus: false, // Evita revalidar en focus para prevenir ciclos
      revalidateOnReconnect: false, // Evita revalidar en reconexiones
      dedupingInterval: 10000, // 10 segundos para deduplicar peticiones
      errorRetryCount: 2 // Limitar reintentos
    }
  );

  return {
    projects: data || [],
    isLoading: isLoading || !session, // Considerar loading si la sesión no está cargada
    isError: error,
  };
}

/**
 * Hook para obtener estadísticas de proyectos
 */
export function useProjectStats() {
  const { data, error, isLoading } = useSWR<ProjectStats>(PROJECTS_STATUS_API, fetcher);

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
      
      // Revalidar la caché de proyectos
      mutate(PROJECTS_API);
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
      
      // Revalidar la caché
      mutate(PROJECTS_API);
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
  
  console.log(`Cambiando estado del proyecto: ${projectIdJira} a ${nuevoEstado}`);
  
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
      const currentData = await fetcher(PROJECTS_API);
      
      // Aplicamos una actualización optimista a la caché
      if (currentData && Array.isArray(currentData)) {
        const optimisticData = currentData.map(project => {
          // Si este es el proyecto que estamos actualizando, cambiamos su estado
          if (project.idJira === projectIdJira || project.id === id) {
            return {
              ...project,
              ...updates
            };
          }
          return project;
        });
        
        // Actualiza inmediatamente la caché con nuestros datos optimistas
        mutate(PROJECTS_API, optimisticData, false);
      }
      
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
      
      // Revalidar la caché con los datos reales del servidor
      mutate(PROJECTS_API);
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
      
      // Revalidar la caché
      mutate(PROJECTS_API);
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
