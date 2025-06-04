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
import { useIncidents } from './useIncidents';

export function useAnalystStats(analystId: string, timeFrame: 'week' | 'month' | 'year' = 'month') {
  // Obtenemos primero los datos de incidentes
  const { incidents, isLoading: incidentsLoading, isError: incidentsError } = useIncidents();
  
  // Usamos SWR para obtener el analista
  const { data: analystData, error: analystError, isLoading: analystLoading } = useSWR<QAAnalyst>(
    analystId ? `/api/analysts/${analystId}` : null, 
    fetcher
  );
  
  const isLoading = incidentsLoading || analystLoading;
  const error = incidentsError || analystError;
  
  // Calculamos las estadísticas solo si tenemos todos los datos necesarios
  let data: AnalystStats | undefined;
  
  if (!isLoading && !error && incidents && analystData) {
    // Generamos estadísticas basadas en datos reales
    data = calculateAnalystStats(analystData, incidents, timeFrame);
  }
  
  return {
    stats: data,
    isLoading,
    isError: !!error
  };
}

/**
 * Función para calcular estadísticas reales basadas en incidentes de la base de datos
 */
import { Incident, BugType } from '@/models/Incident';
import { addDays, subDays, subMonths, subYears, format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Función para generar datos de actividad desde los incidentes reales
 */
function generateActivityDataFromIncidents(incidents: Incident[], timeFrame: string): { date: string; count: number }[] {
  const today = new Date();
  let days = 7;
  let interval = 'day';
  
  if (timeFrame === 'month') {
    days = 30;
    interval = 'day';
  } else if (timeFrame === 'year') {
    days = 12;
    interval = 'month';
  }
  
  // Crear un mapa para contar incidentes por fecha
  const activityMap = new Map<string, number>();
  
  // Inicializar el mapa con todas las fechas en el rango
  if (timeFrame === 'year') {
    // Para año, inicializar con los 12 meses
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = today.getMonth();
    
    for (let i = 0; i < 12; i++) {
      // Ordenar los meses empezando desde hace un año hasta el mes actual
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      activityMap.set(months[monthIndex], 0);
    }
    
    // Contar incidentes por mes
    incidents.forEach(incident => {
      const date = new Date(incident.fechaReporte);
      const monthName = months[date.getMonth()];
      activityMap.set(monthName, (activityMap.get(monthName) || 0) + 1);
    });
  } else {
    // Para semana/mes, inicializar con los días en formato DD/MM
    let startDate = timeFrame === 'week' ? subDays(today, 6) : subDays(today, 29);
    
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const formattedDate = format(date, 'dd/MM');
      activityMap.set(formattedDate, 0);
    }
    
    // Contar incidentes por día
    incidents.forEach(incident => {
      const date = new Date(incident.fechaReporte);
      // Solo contar si está dentro del rango de fechas que nos interesa
      if (date >= startDate && date <= today) {
        const formattedDate = format(date, 'dd/MM');
        activityMap.set(formattedDate, (activityMap.get(formattedDate) || 0) + 1);
      }
    });
  }
  // Solo usamos los datos reales sin añadir datos inventados
  // El mapa ya contiene los registros de actividad real
  
  // Convertir el mapa a un array de objetos con el formato requerido
  return Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }));
}

export function calculateAnalystStats(analyst: QAAnalyst, incidents: Incident[], timeFrame: string): AnalystStats {
  // Calculamos la fecha límite según el período seleccionado
  const today = new Date();
  let startDate = today;
  
  if (timeFrame === 'week') {
    startDate = subDays(today, 7);
  } else if (timeFrame === 'month') {
    startDate = subMonths(today, 1);
  } else if (timeFrame === 'year') {
    startDate = subYears(today, 1);
  }
    // Filtrar incidentes relacionados con este analista y dentro del período seleccionado
  // Usamos una comparación flexible (case-insensitive y parcial) para mayor probabilidad de coincidencia
  const analystName = analyst.name.toLowerCase();
  const analystIncidents = incidents.filter(incident => {
    const assignedTo = incident.asignadoA?.toLowerCase() || '';
    const reportedBy = incident.informadoPor?.toLowerCase() || '';
    
    // Verificar si el nombre del analista coincide parcial o completamente
    return assignedTo.includes(analystName) || 
           reportedBy.includes(analystName) ||
           analystName.includes(assignedTo) ||
           analystName.includes(reportedBy);
  }).filter(incident =>
    new Date(incident.fechaReporte) >= startDate && new Date(incident.fechaReporte) <= today
  );
    // Si no hay incidentes para este analista, las gráficas mostrarán mensajes informativos
  if (analystIncidents.length === 0) {
    console.log(`No hay incidentes para ${analyst.name}, se mostrarán gráficas sin datos`);
  }
  
  // Incidentes reportados por este analista
  const incidentsCaught = analystIncidents.filter(incident => 
    incident.informadoPor === analyst.name
  ).length;
  
  // Incidentes resueltos donde este analista está asignado
  const incidentsResolved = analystIncidents.filter(incident => 
    incident.asignadoA === analyst.name && incident.fechaSolucion
  ).length;
  
  // Calcular tiempo promedio de resolución en días
  let totalResolutionTime = 0;
  let resolvedCount = 0;
  
  analystIncidents.forEach(incident => {
    if (incident.fechaSolucion && incident.fechaReporte) {
      const resolutionTime = (new Date(incident.fechaSolucion).getTime() - new Date(incident.fechaReporte).getTime()) / (1000 * 3600 * 24);
      totalResolutionTime += resolutionTime;
      resolvedCount++;
    }
  });
  
  const avgResolutionTime = resolvedCount > 0 
    ? parseFloat((totalResolutionTime / resolvedCount).toFixed(1)) 
    : 0;
    // Contar por prioridad
  const byPriorityCount = {
    Alta: 0,
    Media: 0,
    Baja: 0
  };
  
  analystIncidents.forEach(incident => {
    const priority = incident.prioridad?.trim();
    if (priority === 'Alta' || priority === 'Media' || priority === 'Baja') {
      byPriorityCount[priority]++;
    }
  });
    // Solo usamos datos reales, sin datos inventados
  // Si no hay incidentes, los valores serán cero
    // Contar por tipo de bug
  const byTypeCount = {
    UI: 0,
    Funcional: 0,
    Rendimiento: 0,
    Seguridad: 0
  };
  
  analystIncidents.forEach(incident => {
    const bugType = incident.tipoBug as keyof typeof byTypeCount;
    if (bugType && bugType in byTypeCount) {
      byTypeCount[bugType]++;
    }
  });
    // Solo usamos datos reales, sin datos inventados
  // Si no hay incidentes, los valores serán cero
  
  // Calculamos la actividad diaria en el período seleccionado
  const lastMonthActivity = generateActivityDataFromIncidents(analystIncidents, timeFrame);
    // Estadísticas base para todos los analistas
  const baseStats: AnalystStats = {
    incidentsCaught: incidentsCaught,
    incidentsResolved: incidentsResolved,
    avgResolutionTime: avgResolutionTime,
    byPriority: [
      { name: 'Alta', value: byPriorityCount.Alta },
      { name: 'Media', value: byPriorityCount.Media },
      { name: 'Baja', value: byPriorityCount.Baja },
    ],
    byType: [
      { name: 'UI', value: byTypeCount.UI },
      { name: 'Funcional', value: byTypeCount.Funcional },
      { name: 'Rendimiento', value: byTypeCount.Rendimiento },
      { name: 'Seguridad', value: byTypeCount.Seguridad },
    ],
    lastMonthActivity: lastMonthActivity,
  };
  // Si el analista es QA Leader y tenemos incidentes reales, calculamos métricas basadas solo en datos reales
  if (analyst.role === 'QA Leader' && analystIncidents.length > 0) {
    // Calcular datos basados únicamente en los incidentes reales
    // No añadir datos inventados o "razonables"
    
    // Eficiencia: proporción de incidentes resueltos vs reportados
    const teamEfficiency = incidentsCaught > 0 
      ? Math.round((incidentsResolved / incidentsCaught) * 100)
      : 0; 
    
    // Cobertura: basada en tipos de bugs encontrados
    const uniqueBugTypes = Object.values(byTypeCount).filter(count => count > 0).length;
    const teamCoverage = uniqueBugTypes > 0 
      ? Math.round((uniqueBugTypes / 4) * 100)
      : 0;
    
    // Solo añadimos estas métricas si tenemos suficientes datos reales
    // No inventamos datos para el rendimiento del equipo
    const teamSize = analystIncidents
      .map(incident => incident.asignadoA)
      .filter((name): name is string => !!name)
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .length;
    
    if (teamSize > 0) {
      baseStats.teamMetrics = {
        teamSize,
        teamEfficiency,
        teamCoverage,
        // No incluimos datos de rendimiento individual si no los tenemos
        membersPerformance: [],
      };
    }
      // Solo incluimos la métrica de eficiencia de procesos que se basa en datos reales
    // No incluimos métricas estimadas que no provienen directamente de la base de datos
    if (incidentsResolved > 0 && incidentsCaught > 0) {
      baseStats.leadershipMetrics = {
        reviewsCompleted: 0, // No tenemos datos reales para estas métricas
        trainingsLed: 0,
        improvementProposals: 0,
        processEfficiency: Math.round((incidentsResolved / incidentsCaught) * 100),
      };
    }
  }
  
  return baseStats;
}

/**
 * Nota: La anterior función generateActivityData ha sido reemplazada 
 * por generateActivityDataFromIncidents que utiliza datos reales de incidentes
 */
