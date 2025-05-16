import { NextResponse } from 'next/server';
import { incidentService } from '@/services/incidentService';
import { QAAnalystService } from '@/services/qaAnalystService';

const analystService = new QAAnalystService();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Esperar el objeto params antes de acceder a sus propiedades
    const { id } = await params;
    const searchParams = new URL(request.url).searchParams;
    const timeframe = searchParams.get('timeframe') || 'month';
    
    // Verificar que el analista existe
    const analyst = await analystService.getAnalystById(id);
    if (!analyst) {
      return NextResponse.json({ error: 'Analyst not found' }, { status: 404 });
    }    // Obtener todos los incidentes
    const incidents = await incidentService.getAll();
    
    // Filtrar por fecha según el timeframe
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setMonth(now.getMonth() - 1); // Por defecto: último mes
    }

    // Filtrar los incidentes por fecha y por analista
    const relevantIncidents = incidents.filter(incident => {
      const incidentDate = new Date(incident.fechaCreacion);
      return incidentDate >= cutoffDate && 
             (incident.informadoPor === analyst.name || incident.asignadoA === analyst.name);
    });

    // Incidentes reportados por el analista
    const incidentsReported = relevantIncidents.filter(inc => inc.informadoPor === analyst.name);
    
    // Incidentes asignados al analista
    const incidentsAssigned = relevantIncidents.filter(inc => inc.asignadoA === analyst.name);
    
    // Incidentes resueltos por el analista
    const incidentsResolved = incidentsAssigned.filter(inc => inc.estado === 'Resuelto' || inc.estado === 'Cerrado');

    // Tiempo medio de resolución (en días)
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    
    incidentsResolved.forEach(inc => {
      if (inc.fechaSolucion && inc.fechaCreacion) {
        const solutionDate = new Date(inc.fechaSolucion);
        const creationDate = new Date(inc.fechaCreacion);
        const timeDiff = solutionDate.getTime() - creationDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        totalResolutionTime += daysDiff;
        resolvedCount++;
      }
    });
    
    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    // Distribución por prioridad
    const byPriority = [
      { name: 'Alta', value: incidentsReported.filter(inc => inc.prioridad === 'Alta').length },
      { name: 'Media', value: incidentsReported.filter(inc => inc.prioridad === 'Media').length },
      { name: 'Baja', value: incidentsReported.filter(inc => inc.prioridad === 'Baja').length }
    ].filter(item => item.value > 0);

    // Distribución por tipo de bug
    const byType = [
      { name: 'UI', value: incidentsReported.filter(inc => inc.tipoBug === 'UI').length },
      { name: 'Funcional', value: incidentsReported.filter(inc => inc.tipoBug === 'Funcional').length },
      { name: 'Performance', value: incidentsReported.filter(inc => inc.tipoBug === 'Performance').length },
      { name: 'Seguridad', value: incidentsReported.filter(inc => inc.tipoBug === 'Seguridad').length },
      { name: 'BD', value: incidentsReported.filter(inc => inc.tipoBug === 'Base de Datos').length },
      { name: 'Integración', value: incidentsReported.filter(inc => inc.tipoBug === 'Integración').length },
      { name: 'Otro', value: incidentsReported.filter(inc => inc.tipoBug === 'Otro' || !inc.tipoBug).length }
    ].filter(item => item.value > 0);

    // Actividad del último mes
    const lastMonthActivity = [];
    
    // Para simplificar, generamos datos para los últimos 30 días (o 7 días si es semanal)
    const days = timeframe === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = incidentsReported.filter(inc => {
        const incDate = new Date(inc.fechaCreacion);
        return incDate >= date && incDate < nextDate;
      }).length;
      
      // Formato de fecha abreviado
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
      
      lastMonthActivity.unshift({ date: formattedDate, count });
    }

    // Respuesta final
    const stats = {
      incidentsCaught: incidentsReported.length,
      incidentsResolved: incidentsResolved.length,
      avgResolutionTime,
      byPriority,
      byType,
      lastMonthActivity
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error getting analyst stats:', error);
    return NextResponse.json({ error: 'Error getting analyst stats' }, { status: 500 });
  }
}
