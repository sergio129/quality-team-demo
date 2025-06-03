import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { MetricasTemporales, MetricasCasosPrueba, MetricasProyecto } from '@/services/metricasService';

const METRICAS_API = '/api/metricas';

/**
 * Hook para obtener métricas de incidentes por mes
 */
export function useMetricasIncidentes(mesesAtras: number = 6) {
  const { data, error, isLoading } = useSWR<MetricasTemporales[]>(
    `${METRICAS_API}/incidentes?meses=${mesesAtras}`,
    fetcher,
    { refreshInterval: 30000 } // Refrescar cada 30 segundos
  );

  return {
    metricasIncidentes: data || [],
    isLoading,
    isError: !!error,
    error
  };
}

/**
 * Hook para obtener métricas de casos de prueba por proyecto
 */
export function useMetricasCasosPrueba() {
  const { data, error, isLoading } = useSWR<MetricasCasosPrueba[]>(
    `${METRICAS_API}/casos-prueba`,
    fetcher,
    { refreshInterval: 60000 } // Refrescar cada minuto
  );

  return {
    metricasCasosPrueba: data || [],
    isLoading,
    isError: !!error,
    error
  };
}

/**
 * Hook para obtener métricas consolidadas por proyecto
 */
export function useMetricasConsolidadas() {
  const { data, error, isLoading } = useSWR<MetricasProyecto[]>(
    `${METRICAS_API}/consolidadas`,
    fetcher,
    { refreshInterval: 60000 }
  );

  return {
    metricasConsolidadas: data || [],
    isLoading,
    isError: !!error,
    error
  };
}

/**
 * Hook para obtener resumen de métricas principales
 */
export function useResumenMetricas() {
  const { data, error, isLoading } = useSWR(
    `${METRICAS_API}/resumen`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    resumen: data || {
      totalIncidentes: 0,
      totalCasosPrueba: 0,
      porcentajeExito: 0,
      casosEjecutados: 0,
      incidentesAbiertos: 0,
      incidentesPorPrioridad: { Alta: 0, Media: 0, Baja: 0 }
    },
    isLoading,
    isError: !!error,
    error
  };
}
