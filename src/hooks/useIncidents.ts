import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';
import { Incident } from '@/models/Incident';

// API endpoints
const INCIDENTS_API = '/api/incidents';
const INCIDENTS_STATS_API = '/api/incidents/stats';

// Tipo para estadísticas de incidentes
export interface IncidentStats {
  totalPorCliente: Record<string, number>;
  totalPorPrioridad: {
    Alta: number;
    Media: number;
    Baja: number;
  };
  totalAbiertas: number;
}

// Tipo para datos del formulario de incidentes
export interface IncidentFormData {
  celula: string;
  estado: string;
  prioridad: string;
  descripcion: string;
  fechaCreacion?: Date;
  fechaReporte: Date;
  fechaSolucion?: Date;
  informadoPor: string;
  asignadoA: string;
  cliente: string;
  idJira: string;
  tipoBug?: string;
  areaAfectada?: string;
  etiquetas?: string[];
  esErroneo?: boolean;
  aplica?: boolean;
}

/**
 * Hook para obtener todos los incidentes
 */
export function useIncidents() {
  const { data, error, isLoading } = useSWR<Incident[]>(INCIDENTS_API, fetcher);

  return {
    incidents: data || [],
    isLoading,
    isError: error,
  };
}

/**
 * Hook para obtener estadísticas de incidentes
 */
export function useIncidentStats() {
  const { data, error, isLoading } = useSWR<IncidentStats>(INCIDENTS_STATS_API, fetcher);

  return {
    stats: data || {
      totalPorCliente: {},
      totalPorPrioridad: { Alta: 0, Media: 0, Baja: 0 },
      totalAbiertas: 0
    },
    isLoading,
    isError: error,
  };
}

/**
 * Función para crear un nuevo incidente
 */
export async function createIncident(incident: IncidentFormData) {
  return toast.promise(
    async () => {
      const response = await fetch(INCIDENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el incidente');
      }

      const newIncident = await response.json();
      
      // Revalidar la caché
      mutate(INCIDENTS_API);
      mutate(INCIDENTS_STATS_API);
      
      return newIncident;
    },
    {
      loading: 'Creando incidente...',
      success: 'Incidente creado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar un incidente existente
 */
export async function updateIncident(id: string, incident: Partial<IncidentFormData>) {
  return toast.promise(
    async () => {
      const response = await fetch(INCIDENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, incident }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el incidente');
      }

      const updatedIncident = await response.json();
      
      // Revalidar la caché
      mutate(INCIDENTS_API);
      mutate(`${INCIDENTS_API}/${id}`);
      mutate(INCIDENTS_STATS_API);
      
      return updatedIncident;
    },
    {
      loading: 'Actualizando incidente...',
      success: 'Incidente actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para cambiar el estado de un incidente
 */
export async function changeIncidentStatus(id: string, nuevoEstado: string, comentario?: string) {
  return toast.promise(
    async () => {
      // Creamos un nuevo objeto con los cambios
      const changes: any = { estado: nuevoEstado };
      
      // Solo añadimos el comentario si existe
      if (comentario) {
        // En lugar de añadirlo directamente, podríamos añadirlo a historialEstados
        // pero esto dependerá de la implementación del backend
      }
      
      const response = await fetch(INCIDENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          incident: changes
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al cambiar el estado del incidente');
      }

      const updatedIncident = await response.json();
      
      // Revalidar la caché
      mutate(INCIDENTS_API);
      mutate(`${INCIDENTS_API}/${id}`);
      mutate(INCIDENTS_STATS_API);
      
      return updatedIncident;
    },
    {
      loading: 'Cambiando estado...',
      success: 'Estado actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un incidente
 */
export async function deleteIncident(id: string) {
  return toast.promise(
    async () => {
      const response = await fetch(INCIDENTS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el incidente');
      }
      
      // Revalidar la caché
      mutate(INCIDENTS_API);
      mutate(INCIDENTS_STATS_API);
      
      return true;
    },
    {
      loading: 'Eliminando incidente...',
      success: 'Incidente eliminado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}
