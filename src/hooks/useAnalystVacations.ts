'use client';

import { AnalystVacation } from '@/models/AnalystVacation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';

// API endpoints
const VACATIONS_API = '/api/analyst-vacations';

/**
 * Hook para obtener todas las vacaciones
 */
export function useAnalystVacations() {
  const { data, error, isLoading } = useSWR<AnalystVacation[]>(VACATIONS_API, fetcher);

  return {
    vacations: data || [],
    isLoading,
    isError: error,
  };
}

/**
 * Función para obtener vacaciones por analista
 * @param analystId ID del analista
 */
export function useAnalystVacationsByAnalyst(analystId: string) {
  const { data, error, isLoading } = useSWR<AnalystVacation[]>(
    `${VACATIONS_API}?analystId=${analystId}`, 
    fetcher
  );

  return {
    vacations: data || [],
    isLoading,
    isError: error,
  };
}

/**
 * Función para crear un nuevo registro de vacaciones
 */
export async function createAnalystVacation(vacation: Omit<AnalystVacation, 'id'>) {
  return toast.promise(
    async () => {
      const response = await fetch(VACATIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacation),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al registrar las vacaciones');
      }

      const result = await response.json();
      
      // Revalidar la caché
      mutate(VACATIONS_API);
      mutate(`${VACATIONS_API}?analystId=${vacation.analystId}`);
      
      return result;
    },
    {
      loading: 'Registrando vacaciones...',
      success: 'Vacaciones registradas exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un registro de vacaciones
 */
export async function deleteAnalystVacation(id: string) {
  return toast.promise(
    async () => {
      const response = await fetch(VACATIONS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar las vacaciones');
      }
      
      // Revalidar la caché
      mutate(VACATIONS_API);
      
      return true;
    },
    {
      loading: 'Eliminando registro de vacaciones...',
      success: 'Vacaciones eliminadas exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para verificar si un analista está de vacaciones en una fecha específica
 */
export function isAnalystOnVacation(vacations: AnalystVacation[], analystId: string, date: Date): AnalystVacation | null {
  if (!vacations || vacations.length === 0) return null;
  
  // Normalizar la fecha que queremos comprobar (solo la fecha sin hora)
  const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  console.log(`Verificando vacaciones para analista ${analystId} en fecha ${dateToCheck.toISOString().split('T')[0]}`);
  
  return vacations.find(vacation => {
    // Solo considerar vacaciones del analista especificado
    if (vacation.analystId !== analystId) return false;
    
    // Convertir fechas a objetos Date normalizados (sin considerar la hora)
    let startDate: Date;
    let endDate: Date;
    
    if (vacation.startDate instanceof Date) {
      startDate = new Date(vacation.startDate.getFullYear(), vacation.startDate.getMonth(), vacation.startDate.getDate());
    } else {
      // Si es string, crear un nuevo Date pero garantizando que es solo la fecha
      const parts = vacation.startDate.toString().split('T')[0].split('-');
      startDate = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    }
    
    if (vacation.endDate instanceof Date) {
      endDate = new Date(vacation.endDate.getFullYear(), vacation.endDate.getMonth(), vacation.endDate.getDate());
    } else {
      // Si es string, crear un nuevo Date pero garantizando que es solo la fecha
      const parts = vacation.endDate.toString().split('T')[0].split('-');
      endDate = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    }
    
    // Comparar solo las fechas sin considerar la hora
    console.log(`Comparando: ${dateToCheck.toISOString().split('T')[0]} con rango ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);
    
    // Verificar si la fecha cae dentro del periodo de vacaciones
    return dateToCheck >= startDate && dateToCheck <= endDate;
  }) || null;
}
