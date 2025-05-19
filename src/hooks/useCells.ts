import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Cell } from '@/models/Cell';
import { toast } from 'sonner';

// API endpoints
const CELLS_API = '/api/cells';
const TEAMS_API = '/api/teams';

// Tipo para datos del equipo
export interface TeamInfo {
  id: string;
  name: string;
}

// Tipo seguro para los datos del formulario
export type CellFormData = {
  name: string;
  teamId: string;
  description?: string | null;
};

/**
 * Hook para obtener todas las células
 */
export function useCells() {
  const { data, error, isLoading, isValidating } = useSWR<Cell[]>(CELLS_API, fetcher);

  return {
    cells: data || [],
    isLoading,
    isError: !!error,
    isValidating,
    error
  };
}

/**
 * Hook para obtener todos los equipos
 */
export function useTeams() {
  const { data, error, isLoading } = useSWR<TeamInfo[]>(TEAMS_API, fetcher);

  return {
    teams: data || [],
    isLoading: isLoading,
    isError: !!error,
    error
  };
}

/**
 * Función para crear una nueva célula
 */
export async function createCell(cell: CellFormData) {
  return toast.promise(
    async () => {
      const response = await fetch(CELLS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cell),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear la célula');
      }

      const newCell = await response.json();
      
      // Revalidar la caché
      mutate(CELLS_API);
      
      return newCell;
    },
    {
      loading: 'Creando célula...',
      success: 'Célula creada exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar una célula existente
 */
export async function updateCell(id: string, cell: Partial<CellFormData>) {
  return toast.promise(
    async () => {
      const response = await fetch(CELLS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...cell }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar la célula');
      }

      const updatedCell = await response.json();
      
      // Revalidar la caché
      mutate(CELLS_API);
      
      return updatedCell;
    },
    {
      loading: 'Actualizando célula...',
      success: 'Célula actualizada exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar una célula
 */
export async function deleteCell(id: string) {
  return toast.promise(
    async () => {
      const response = await fetch(CELLS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar la célula');
      }
      
      // Revalidar la caché
      mutate(CELLS_API);
      
      return true;
    },
    {
      loading: 'Eliminando célula...',
      success: 'Célula eliminada exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}
