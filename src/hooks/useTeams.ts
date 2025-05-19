import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Team } from '@/models/Team';
import { toast } from 'sonner';

// API endpoints
const TEAMS_API = '/api/teams';

/**
 * Hook para obtener todos los equipos
 */
export function useTeams() {
  const { data, error, isLoading, isValidating } = useSWR<Team[]>(TEAMS_API, fetcher);

  return {
    teams: data || [],
    isLoading,
    isError: !!error,
    isValidating,
    error
  };
}

// Tipo seguro para los datos del formulario
export type TeamFormData = {
  name: string;
  description?: string | null;
};

/**
 * Función para crear un nuevo equipo
 */
export async function createTeam(team: TeamFormData) {
  return toast.promise(
    async () => {
      const response = await fetch(TEAMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el equipo');
      }

      const newTeam = await response.json();
      
      // Revalidar la caché
      mutate(TEAMS_API);
      
      return newTeam;
    },
    {
      loading: 'Creando equipo...',
      success: 'Equipo creado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar un equipo existente
 */
export async function updateTeam(id: string, team: Partial<TeamFormData>) {
  return toast.promise(
    async () => {
      const response = await fetch(TEAMS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...team }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el equipo');
      }

      const updatedTeam = await response.json();
      
      // Revalidar la caché
      mutate(TEAMS_API);
      
      return updatedTeam;
    },
    {
      loading: 'Actualizando equipo...',
      success: 'Equipo actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un equipo
 */
export async function deleteTeam(id: string) {
  return toast.promise(
    async () => {
      const response = await fetch(TEAMS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el equipo');
      }
      
      // Revalidar la caché
      mutate(TEAMS_API);
      
      return true;
    },
    {
      loading: 'Eliminando equipo...',
      success: 'Equipo eliminado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}
