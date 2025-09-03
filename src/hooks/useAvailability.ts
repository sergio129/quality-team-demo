import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';

export interface AvailabilityData {
  analystId: string;
  analystName: string;
  totalAssignedHours: number;
  availabilityPercentage: number;
  activeProjectsCount: number;
  workloadLevel: 'Bajo' | 'Medio' | 'Alto' | 'Sobrecarga';
}

/**
 * Hook para obtener las disponibilidades calculadas de todos los analistas
 */
export function useAvailabilities() {
  const { data, error, isLoading, isValidating } = useSWR<AvailabilityData[]>(
    '/api/availability', 
    fetcher,
    {
      refreshInterval: 300000, // Refrescar cada 5 minutos
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    availabilities: data || [],
    isLoading,
    isError: !!error,
    isValidating,
    error
  };
}

/**
 * Hook para obtener la disponibilidad de un analista específico
 */
export function useAnalystAvailability(analystId: string | null) {
  const { availabilities, isLoading, isError } = useAvailabilities();
  
  const analystAvailability = availabilities.find(
    availability => availability.analystId === analystId
  );

  return {
    availability: analystAvailability || null,
    isLoading,
    isError
  };
}

/**
 * Actualiza la disponibilidad de todos los analistas en la base de datos
 */
export async function updateAllAvailabilities() {
  return toast.promise(
    async () => {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateAll' }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar disponibilidades');
      }

      const result = await response.json();
      
      // Revalidar las cachés
      await Promise.all([
        mutate('/api/availability'),
        mutate('/api/analysts')
      ]);
      
      return result;
    },
    {
      loading: 'Actualizando disponibilidades...',
      success: 'Disponibilidades actualizadas exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Actualiza la disponibilidad de un analista específico
 */
export async function updateAnalystAvailability(analystId: string) {
  return toast.promise(
    async () => {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateOne', analystId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar disponibilidad');
      }

      const result = await response.json();
      
      // Revalidar las cachés
      await Promise.all([
        mutate('/api/availability'),
        mutate('/api/analysts'),
        mutate(`/api/analysts/${analystId}`)
      ]);
      
      return result;
    },
    {
      loading: 'Actualizando disponibilidad...',
      success: 'Disponibilidad actualizada exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Obtiene la disponibilidad calculada de un analista sin actualizar la BD
 */
export async function calculateAnalystAvailability(analystId: string): Promise<AvailabilityData> {
  const response = await fetch('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'calculate', analystId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Error al calcular disponibilidad');
  }

  return await response.json();
}
