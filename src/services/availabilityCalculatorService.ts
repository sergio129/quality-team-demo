import { prisma } from '@/lib/prisma';

export interface AvailabilityData {
  analystId: string;
  analystName: string;
  totalAssignedHours: number;
  availabilityPercentage: number;
  activeProjectsCount: number;
  workloadLevel: 'Bajo' | 'Medio' | 'Alto' | 'Sobrecarga';
}

export class AvailabilityCalculatorService {
  private static readonly MAX_MONTHLY_HOURS = 180;
  
  /**
   * Calcula la disponibilidad de un analista basado en sus proyectos asignados
   */
  async calculateAnalystAvailability(analystId: string): Promise<AvailabilityData> {
    try {
      // Obtener información del analista
      const analyst = await prisma.qAAnalyst.findUnique({
        where: { id: analystId }
      });

      if (!analyst) {
        throw new Error(`Analista con ID ${analystId} no encontrado`);
      }

      // Obtener todos los proyectos asignados al analista en el mes actual
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

      // Buscar proyectos donde el analista esté asignado
      const projects = await prisma.project.findMany({
        where: {
          analistaProducto: analyst.name
        }
      });

      // Filtrar proyectos que realmente pertenecen al analista y al mes actual
      const analystProjects = projects.filter(project => {
        // Verificar que el proyecto esté asignado al analista
        if (project.analistaProducto !== analyst.name) return false;

        // Verificar que el proyecto pertenezca al mes actual
        const projectStartDate = project.fechaInicio ? new Date(project.fechaInicio) : null;
        const projectEndDate = project.fechaEntrega ? new Date(project.fechaEntrega) : null;

        // El proyecto pertenece al mes si:
        // 1. Tiene fecha de inicio dentro del mes
        // 2. Tiene fecha de entrega dentro del mes  
        // 3. Empezó antes del mes y termina después (proyecto que abarca el mes)
        // 4. Empezó antes del mes y no tiene fecha de fin (proyecto continuo)
        const startedInMonth = projectStartDate && projectStartDate >= monthStart && projectStartDate <= monthEnd;
        const endsInMonth = projectEndDate && projectEndDate >= monthStart && projectEndDate <= monthEnd;
        const spansMonth = projectStartDate && projectStartDate <= monthStart && 
                          (!projectEndDate || projectEndDate >= monthEnd);

        return startedInMonth || endsInMonth || spansMonth;
      });

      // Calcular horas totales asignadas
      const totalAssignedHours = analystProjects.reduce((total, project) => {
        return total + (project.horasEstimadas || 0);
      }, 0);

      // Calcular disponibilidad
      const usedCapacity = Math.min(totalAssignedHours / AvailabilityCalculatorService.MAX_MONTHLY_HOURS, 1);
      const availabilityPercentage = Math.max(0, Math.round((1 - usedCapacity) * 100));

      // Determinar nivel de carga laboral
      const workloadLevel = this.getWorkloadLevel(totalAssignedHours);

      // Contar proyectos activos (no certificados)
      const activeProjectsCount = analystProjects.filter(project => {
        const status = this.getCalculatedProjectStatus(project);
        return status === 'Por Iniciar' || status === 'En Progreso';
      }).length;

      return {
        analystId,
        analystName: analyst.name,
        totalAssignedHours,
        availabilityPercentage,
        activeProjectsCount,
        workloadLevel
      };

    } catch (error) {
      console.error(`Error calculando disponibilidad para analista ${analystId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula la disponibilidad para todos los analistas
   */
  async calculateAllAnalystsAvailability(): Promise<AvailabilityData[]> {
    try {
      const analysts = await prisma.qAAnalyst.findMany({
        select: { id: true, name: true }
      });

      const availabilities = await Promise.all(
        analysts.map(analyst => this.calculateAnalystAvailability(analyst.id))
      );

      return availabilities;

    } catch (error) {
      console.error('Error calculando disponibilidades de todos los analistas:', error);
      throw error;
    }
  }

  /**
   * Actualiza la disponibilidad de un analista en la base de datos
   */
  async updateAnalystAvailabilityInDatabase(analystId: string): Promise<void> {
    try {
      const availabilityData = await this.calculateAnalystAvailability(analystId);
      
      await prisma.qAAnalyst.update({
        where: { id: analystId },
        data: { 
          availability: availabilityData.availabilityPercentage 
        }
      });

    } catch (error) {
      console.error(`Error actualizando disponibilidad en BD para analista ${analystId}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza la disponibilidad de todos los analistas en la base de datos
   */
  async updateAllAnalystsAvailabilityInDatabase(): Promise<void> {
    try {
      const availabilities = await this.calculateAllAnalystsAvailability();
      
      await Promise.all(
        availabilities.map(availability =>
          prisma.qAAnalyst.update({
            where: { id: availability.analystId },
            data: { 
              availability: availability.availabilityPercentage 
            }
          })
        )
      );

      console.log(`Disponibilidad actualizada para ${availabilities.length} analistas`);

    } catch (error) {
      console.error('Error actualizando disponibilidades en BD:', error);
      throw error;
    }
  }

  /**
   * Determina el nivel de carga laboral basado en las horas asignadas
   */
  private getWorkloadLevel(hours: number): 'Bajo' | 'Medio' | 'Alto' | 'Sobrecarga' {
    const percentageUsed = (hours / AvailabilityCalculatorService.MAX_MONTHLY_HOURS) * 100;

    if (percentageUsed < 30) return 'Bajo';
    if (percentageUsed < 70) return 'Medio';
    if (percentageUsed < 100) return 'Alto';
    return 'Sobrecarga';
  }

  /**
   * Determina el estado calculado de un proyecto
   */
  private getCalculatedProjectStatus(project: any): string {
    const today = new Date();

    // Si ya tiene un estado definido, usarlo
    if (project.estado) {
      if (project.estado.toLowerCase().includes('progreso')) {
        return 'En Progreso';
      } else if (project.estado.toLowerCase().includes('certificado') ||
                project.estado.toLowerCase().includes('completado') ||
                project.estado.toLowerCase().includes('terminado')) {
        return 'Certificado';
      } else if (project.estado.toLowerCase().includes('iniciar')) {
        return 'Por Iniciar';
      } else {
        return 'Por Iniciar';
      }
    }

    // Si tiene certificación en el pasado, está certificado
    if (project.fechaCertificacion && new Date(project.fechaCertificacion) <= today) {
      return 'Certificado';
    }

    // Si tiene fecha de inicio
    if (project.fechaInicio) {
      const fechaInicio = new Date(project.fechaInicio);
      if (fechaInicio > today) {
        return 'Por Iniciar';
      } else if (project.fechaEntrega && new Date(project.fechaEntrega) > today) {
        return 'En Progreso';
      } else {
        return 'En Progreso';
      }
    }

    // Si no tiene fecha de inicio pero tiene fecha de entrega
    if (project.fechaEntrega) {
      const fechaEntrega = new Date(project.fechaEntrega);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      if (fechaEntrega > sevenDaysFromNow) {
        return 'Por Iniciar';
      } else {
        return 'En Progreso';
      }
    }

    // Sin fechas definidas, asumir "Por Iniciar"
    return 'Por Iniciar';
  }
}
