import { useMemo } from 'react';
import { useAllProjects } from '@/hooks/useProjects';
import { QAAnalyst } from '@/models/QAAnalyst';

interface AnalystAvailabilityData {
  analystId: string;
  availabilityPercentage: number;
  totalAssignedHours: number;
  activeProjectsCount: number;
  workloadLevel: 'Bajo' | 'Medio' | 'Alto' | 'Sobrecarga';
}

/**
 * Hook que calcula la disponibilidad para todos los analistas usando la misma lógica del modal
 */
export function useAnalystsAvailability(analysts: QAAnalyst[] | undefined) {
  const { projects: allProjects } = useAllProjects();
  
  return useMemo(() => {
    if (!analysts?.length || !allProjects?.length) return [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const MAX_MONTHLY_HOURS = 180;

    // Función para determinar el estado calculado (copiado del modal)
    const getCalculatedStatus = (project: any) => {
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

      // Si no tiene estado definido, calcularlo automáticamente
      if (project.fechaCertificacion && new Date(project.fechaCertificacion) <= today) {
        return 'Certificado';
      }
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
      return 'Por Iniciar';
    };

    // Función para determinar si un proyecto pertenece al mes actual (copiado del modal)
    const isProjectInCurrentMonth = (project: any) => {
      const projectStatus = getCalculatedStatus(project);

      // Para proyectos certificados, usar fecha de certificación
      if (projectStatus === 'Certificado' && project.fechaCertificacion) {
        const certDate = new Date(project.fechaCertificacion);
        const certMonth = certDate.getMonth();
        const certYear = certDate.getFullYear();
        return certMonth === currentMonth && certYear === currentYear;
      }

      // Para proyectos activos, usar fecha de entrega o inicio
      const relevantDate = project.fechaEntrega || project.fechaInicio;
      if (!relevantDate) return true; // Incluir proyectos sin fechas como del mes actual

      const projectDate = new Date(relevantDate);
      const projectMonth = projectDate.getMonth();
      const projectYear = projectDate.getFullYear();

      return projectMonth === currentMonth && projectYear === currentYear;
    };

    // Determinar nivel de carga
    const getWorkloadLevel = (hours: number): 'Bajo' | 'Medio' | 'Alto' | 'Sobrecarga' => {
      const percentageUsed = (hours / MAX_MONTHLY_HOURS) * 100;

      if (percentageUsed < 30) return 'Bajo';
      if (percentageUsed < 70) return 'Medio';  
      if (percentageUsed < 100) return 'Alto';
      return 'Sobrecarga';
    };

    // Calcular para cada analista
    return analysts.map(analyst => {
      // Filtrar proyectos asignados al analista
      const allAnalystProjects = allProjects.filter(project => {
        return project.analistaProducto && project.analistaProducto === analyst.name;
      });

      // Filtrar proyectos del mes actual
      const filteredProjects = allAnalystProjects.filter(project =>
        isProjectInCurrentMonth(project)
      );

      // Calcular TODAS las horas asignadas (igual que en el modal)
      const totalAssignedHours = filteredProjects.reduce((total, project) =>
        total + (project.horasEstimadas || project.horas || 0), 0
      );

      // Calcular disponibilidad (igual que en el modal)
      const usedCapacity = Math.min(totalAssignedHours / MAX_MONTHLY_HOURS, 1);
      const availabilityPercentage = Math.max(0, Math.round((1 - usedCapacity) * 100));

      // Determinar nivel de carga
      const workloadLevel = getWorkloadLevel(totalAssignedHours);

      // Contar proyectos activos
      const activeProjectsCount = filteredProjects.filter(project => {
        const status = getCalculatedStatus(project);
        return status === 'Por Iniciar' || status === 'En Progreso';
      }).length;

      return {
        analystId: analyst.id,
        availabilityPercentage,
        totalAssignedHours,
        activeProjectsCount,
        workloadLevel
      };
    });

  }, [analysts, allProjects]);
}
