'use client';

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
 * Hook para obtener todos los proyectos
 */
export function useProjects() {
  const { data, error, isLoading } = useSWR<Project[]>(PROJECTS_API, fetcher);

  return {
    projects: data || [],
    isLoading,
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

      const newProject = await response.json();
      
      // Revalidar la caché
      mutate(PROJECTS_API);
      mutate(PROJECTS_STATUS_API);
      
      return newProject;
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
  
  return toast.promise(
    async () => {
      const response = await fetch(PROJECTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id,
          idJira: projectIdJira, // Aseguramos que siempre se envíe un idJira
          project: { 
            estadoCalculado: nuevoEstado,
            idJira: projectIdJira // Incluimos idJira en el objeto project también
          } 
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al cambiar el estado del proyecto');
      }

      const updatedProject = await response.json();
      
      // Revalidar la caché
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
        body: JSON.stringify({ id }),
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
