import { incidentService } from './incidentService';
import { testCaseService } from './testCaseService';
import { projectService } from './projectService';

export interface MetricasTemporales {
  mes: string;
  total: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
}

export interface MetricasCasosPrueba {
  proyecto: string;
  total: number;
  ejecutados: number;
  pasaron: number;
  fallaron: number;
  pendientes: number;
}

export interface MetricasProyecto {
  proyecto: string;
  estado: string;
  incidentes: number;
  casosPrueba: number;
  avanceCalidad: number;
}

export class MetricasService {
  
  /**
   * Obtener métricas de incidentes agrupadas por mes
   */
  async getIncidentesPorMes(mesesAtras: number = 6): Promise<MetricasTemporales[]> {
    try {
      const incidentes = await incidentService.getAll();
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - mesesAtras);
      
      // Filtrar incidentes de los últimos N meses
      const incidentesRecientes = incidentes.filter(inc => 
        new Date(inc.fechaCreacion) >= fechaLimite
      );

      // Agrupar por mes
      const metricasPorMes: { [key: string]: MetricasTemporales } = {};
      
      incidentesRecientes.forEach(inc => {
        const fecha = new Date(inc.fechaCreacion);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        
        if (!metricasPorMes[mesKey]) {
          metricasPorMes[mesKey] = {
            mes: mesNombre,
            total: 0,
            criticos: 0,
            altos: 0,
            medios: 0,
            bajos: 0
          };
        }
        
        metricasPorMes[mesKey].total++;
        
        // Categorizar por prioridad
        switch (inc.prioridad) {
          case 'Crítica':
          case 'Critica':
            metricasPorMes[mesKey].criticos++;
            break;
          case 'Alta':
            metricasPorMes[mesKey].altos++;
            break;
          case 'Media':
            metricasPorMes[mesKey].medios++;
            break;
          case 'Baja':
            metricasPorMes[mesKey].bajos++;
            break;
        }
      });

      // Convertir a array y ordenar por fecha
      return Object.values(metricasPorMes).sort((a, b) => {
        return new Date(a.mes).getTime() - new Date(b.mes).getTime();
      });
      
    } catch (error) {
      console.error('Error obteniendo métricas de incidentes por mes:', error);
      return [];
    }
  }  /**
   * Obtener métricas de casos de prueba por proyecto
   */
  async getCasosPruebaPorProyecto(): Promise<MetricasCasosPrueba[]> {
    try {
      // Obtener todos los casos de prueba y proyectos
      const todosCasosPrueba = await testCaseService.getAllTestCases();
      const proyectos = await projectService.getAllProjects();
      const metricas: MetricasCasosPrueba[] = [];

      // Agrupar casos por proyecto
      const casosPorProyecto = new Map<string, any[]>();
      
      todosCasosPrueba.forEach(caso => {
        const proyectoId = caso.projectId;
        if (!casosPorProyecto.has(proyectoId)) {
          casosPorProyecto.set(proyectoId, []);
        }
        casosPorProyecto.get(proyectoId)!.push(caso);
      });

      // Generar métricas para cada proyecto
      for (const proyecto of proyectos) {
        const casosPrueba = casosPorProyecto.get(proyecto.id) || [];
        
        const total = casosPrueba.length;
        const ejecutados = casosPrueba.filter(c => c.status !== 'No ejecutado').length;
        const pasaron = casosPrueba.filter(c => c.status === 'Exitoso').length;
        const fallaron = casosPrueba.filter(c => c.status === 'Fallido').length;
        const pendientes = casosPrueba.filter(c => c.status === 'No ejecutado').length;

        metricas.push({
          proyecto: proyecto.proyecto || proyecto.idJira || 'Sin nombre',
          total,
          ejecutados,
          pasaron,
          fallaron,
          pendientes
        });
      }

      // También agregar proyectos que no están en la lista de proyectos pero tienen casos
      casosPorProyecto.forEach((casos, proyectoId) => {
        const proyectoExiste = proyectos.find(p => p.id === proyectoId);
        if (!proyectoExiste && casos.length > 0) {
          const total = casos.length;
          const ejecutados = casos.filter(c => c.status !== 'No ejecutado').length;
          const pasaron = casos.filter(c => c.status === 'Exitoso').length;
          const fallaron = casos.filter(c => c.status === 'Fallido').length;
          const pendientes = casos.filter(c => c.status === 'No ejecutado').length;

          metricas.push({
            proyecto: `Proyecto ${proyectoId}`,
            total,
            ejecutados,
            pasaron,
            fallaron,
            pendientes
          });
        }
      });

      return metricas;
    } catch (error) {
      console.error('Error obteniendo métricas de casos de prueba:', error);
      return [];
    }
  }
  /**
   * Obtener métricas consolidadas por proyecto
   */
  async getMetricasConsolidadas(): Promise<MetricasProyecto[]> {
    try {
      const proyectos = await projectService.getAllProjects();
      const incidentes = await incidentService.getAll();
      const todosCasosPrueba = await testCaseService.getAllTestCases();
      const metricas: MetricasProyecto[] = [];

      // Agrupar casos por proyecto
      const casosPorProyecto = new Map<string, any[]>();
      todosCasosPrueba.forEach(caso => {
        const proyectoId = caso.projectId;
        if (!casosPorProyecto.has(proyectoId)) {
          casosPorProyecto.set(proyectoId, []);
        }
        casosPorProyecto.get(proyectoId)!.push(caso);
      });

      for (const proyecto of proyectos) {
        try {
          // Contar incidentes del proyecto
          const incidentesProyecto = incidentes.filter(inc => 
            inc.idJira?.includes(proyecto.idJira || '') || 
            inc.cliente === proyecto.proyecto
          );
          
          // Obtener casos de prueba del proyecto
          const casosPrueba = casosPorProyecto.get(proyecto.id || '') || [];
          
          // Calcular avance de calidad (% de casos exitosos)
          const totalEjecutados = casosPrueba.filter(c => c.status !== 'No ejecutado').length;
          const exitosos = casosPrueba.filter(c => c.status === 'Exitoso').length;
          const avanceCalidad = totalEjecutados > 0 ? Math.round((exitosos / totalEjecutados) * 100) : 0;

          metricas.push({
            proyecto: proyecto.proyecto || proyecto.idJira || 'Sin nombre',
            estado: proyecto.estado || 'En progreso',
            incidentes: incidentesProyecto.length,
            casosPrueba: casosPrueba.length,
            avanceCalidad
          });
        } catch (error) {
          console.warn(`Error obteniendo métricas consolidadas para proyecto ${proyecto.proyecto}:`, error);
        }
      }

      return metricas;
    } catch (error) {
      console.error('Error obteniendo métricas consolidadas:', error);
      return [];
    }
  }/**
   * Obtener resumen de métricas principales
   */
  async getResumenMetricas() {
    try {
      const [incidentes, stats] = await Promise.all([
        incidentService.getAll(),
        incidentService.getStats()
      ]);

      // Obtener TODOS los casos de prueba directamente
      const todosCasosPrueba = await testCaseService.getAllTestCases();

      const totalCasosPrueba = todosCasosPrueba.length;
      const casosExitosos = todosCasosPrueba.filter(c => c.status === 'Exitoso').length;
      const casosEjecutados = todosCasosPrueba.filter(c => c.status !== 'No ejecutado').length;
      const porcentajeExito = casosEjecutados > 0 ? Math.round((casosExitosos / casosEjecutados) * 100) : 0;

      return {
        totalIncidentes: incidentes.length,
        totalCasosPrueba,
        porcentajeExito,
        casosEjecutados,
        incidentesAbiertos: stats.totalAbiertas,
        incidentesPorPrioridad: stats.totalPorPrioridad
      };
    } catch (error) {
      console.error('Error obteniendo resumen de métricas:', error);
      return {
        totalIncidentes: 0,
        totalCasosPrueba: 0,
        porcentajeExito: 0,
        casosEjecutados: 0,
        incidentesAbiertos: 0,
        incidentesPorPrioridad: { Alta: 0, Media: 0, Baja: 0 }
      };
    }
  }
}

// Exportar instancia del servicio
export const metricasService = new MetricasService();
