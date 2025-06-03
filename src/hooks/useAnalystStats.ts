import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { QAAnalyst, QARole } from '@/models/QAAnalyst';

// Tipos para las estadísticas
interface AnalystStats {
  incidentsCaught: number;
  incidentsResolved: number;
  avgResolutionTime: number;
  byPriority: { name: string; value: number }[];
  byType: { name: string; value: number }[];
  lastMonthActivity: { date: string; count: number }[];
  // Métricas adicionales para QA Leaders
  teamMetrics?: {
    teamSize: number;
    teamEfficiency: number;
    teamCoverage: number;
    membersPerformance: { name: string; performance: number }[];
  };
  leadershipMetrics?: {
    reviewsCompleted: number;
    trainingsLed: number;
    improvementProposals: number;
    processEfficiency: number;
  };
}

/**
 * Hook para obtener estadísticas de un analista
 */
export function useAnalystStats(analystId: string, timeFrame: 'week' | 'month' | 'year' = 'month') {
  const { data, error, isLoading } = useSWR<AnalystStats>(
    analystId ? `/api/analysts/${analystId}/stats?timeframe=${timeFrame}` : null, 
    fetcher
  );

  return {
    stats: data,
    isLoading,
    isError: !!error
  };
}

/**
 * Función para generar estadísticas de demostración, incluyendo métricas específicas para QA Leaders
 */
export function generateDemoStats(analyst: QAAnalyst, timeFrame: string): AnalystStats {
  // Estadísticas base para todos los analistas
  const baseStats: AnalystStats = {
    incidentsCaught: Math.floor(Math.random() * 50) + 10,
    incidentsResolved: Math.floor(Math.random() * 40) + 5,
    avgResolutionTime: parseFloat((Math.random() * 5 + 0.5).toFixed(1)),
    byPriority: [
      { name: 'Alta', value: Math.floor(Math.random() * 25) + 5 },
      { name: 'Media', value: Math.floor(Math.random() * 30) + 10 },
      { name: 'Baja', value: Math.floor(Math.random() * 15) + 5 },
    ],
    byType: [
      { name: 'UI', value: Math.floor(Math.random() * 20) + 5 },
      { name: 'Funcional', value: Math.floor(Math.random() * 25) + 10 },
      { name: 'Rendimiento', value: Math.floor(Math.random() * 15) },
      { name: 'Seguridad', value: Math.floor(Math.random() * 10) },
    ],
    lastMonthActivity: generateActivityData(timeFrame),
  };
  
  // Si el analista es QA Leader, añadir métricas específicas
  if (analyst.role === 'QA Leader') {
    baseStats.teamMetrics = {
      teamSize: Math.floor(Math.random() * 5) + 3,
      teamEfficiency: Math.floor(Math.random() * 20) + 75,
      teamCoverage: Math.floor(Math.random() * 15) + 80,
      membersPerformance: [
        { name: 'Ana García', performance: Math.floor(Math.random() * 20) + 70 },
        { name: 'Juan López', performance: Math.floor(Math.random() * 30) + 60 },
        { name: 'María Pérez', performance: Math.floor(Math.random() * 15) + 80 },
        { name: 'Carlos Ruiz', performance: Math.floor(Math.random() * 25) + 65 },
      ],
    };
    
    baseStats.leadershipMetrics = {
      reviewsCompleted: Math.floor(Math.random() * 15) + 10,
      trainingsLed: Math.floor(Math.random() * 3) + 1,
      improvementProposals: Math.floor(Math.random() * 5) + 2,
      processEfficiency: Math.floor(Math.random() * 15) + 80,
    };
  }
  
  return baseStats;
}

/**
 * Generar datos de actividad para el gráfico de actividad reciente
 */
function generateActivityData(timeFrame: string): { date: string; count: number }[] {
  const result = [];
  let days = 7;
  
  if (timeFrame === 'month') days = 30;
  if (timeFrame === 'year') days = 12; // Usar meses en lugar de días para el año
  
  // Generar etiquetas apropiadas según el período de tiempo
  for (let i = 0; i < days; i++) {
    let label;
    if (timeFrame === 'year') {
      // Para año, usar nombres de mes
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      label = months[i];
    } else {
      // Para semana/mes, usar formato DD/MM
      label = `${String(i + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`;
    }
    
    result.push({
      date: label,
      count: Math.floor(Math.random() * 10) + 1
    });
  }
  
  return result;
}
