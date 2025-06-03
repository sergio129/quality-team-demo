import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { QAAnalyst, Skill, Certification, QARole } from '@/models/QAAnalyst';
import { toast } from 'sonner';

// API endpoints
const ANALYSTS_API = '/api/analysts';
const CELLS_API = '/api/cells';

// Tipo para datos de la célula
export interface CellInfo {
  id: string;
  name: string;
  teamId: string;
}

// Tipo seguro para los datos del formulario
export type AnalystFormData = {
  name: string;
  email: string;
  cellIds: string[];
  role: QARole;
  color?: string;
  skills?: Skill[];
  certifications?: Certification[];
  specialties?: string[];
  availability?: number;
};

/**
 * Hook para obtener todos los analistas
 */
export function useAnalysts() {
  const { data, error, isLoading, isValidating } = useSWR<QAAnalyst[]>(ANALYSTS_API, fetcher);

  return {
    analysts: data || [],
    isLoading,
    isError: !!error,
    isValidating,
    error
  };
}

/**
 * Hook para obtener todas las células
 */
export function useCells() {
  const { data, error, isLoading } = useSWR<CellInfo[]>(CELLS_API, fetcher);

  return {
    cells: data || [],
    isLoading: isLoading,
    isError: !!error,
    error
  };
}

/**
 * Hook para obtener un analista específico por ID
 */
export function useAnalyst(id: string) {
  const { data, error, isLoading } = useSWR<QAAnalyst>(`${ANALYSTS_API}/${id}`, fetcher);

  return {
    analyst: data,
    isLoading,
    isError: !!error,
    error
  };
}

/**
 * Función para crear un nuevo analista
 */
export async function createAnalyst(analyst: AnalystFormData) {
  return toast.promise(
    async () => {
      const response = await fetch(ANALYSTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyst),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el analista');
      }

      const newAnalyst = await response.json();
      
      // Revalidar la caché
      mutate(ANALYSTS_API);
      
      return newAnalyst;
    },
    {
      loading: 'Creando analista...',
      success: 'Analista creado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar un analista existente
 */
export async function updateAnalyst(id: string, analyst: Partial<AnalystFormData>) {
  return toast.promise(
    async () => {
      const response = await fetch(ANALYSTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...analyst }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el analista');
      }

      const updatedAnalyst = await response.json();
      
      // Revalidar la caché
      mutate(ANALYSTS_API);
      mutate(`${ANALYSTS_API}/${id}`);
      
      return updatedAnalyst;
    },
    {
      loading: 'Actualizando analista...',
      success: 'Analista actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un analista
 */
export async function deleteAnalyst(id: string) {
  return toast.promise(
    async () => {
      const response = await fetch(ANALYSTS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el analista');
      }
      
      // Revalidar la caché
      mutate(ANALYSTS_API);
      
      return true;
    },
    {
      loading: 'Eliminando analista...',
      success: 'Analista eliminado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}
