import { useMemo } from 'react';
import { useAnalysts } from './useAnalysts';
import { useAllProjects } from './useProjects';

const MAX_MONTHLY_HOURS = 180;

export function useAnalystsAvailability() {
  const { analysts } = useAnalysts();
  const { projects } = useAllProjects();

  const analystsAvailability = useMemo(() => {
    if (!analysts || !projects) return {};

    const availability: Record<string, number> = {};
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    analysts.forEach(analyst => {
      // Encontrar proyectos asignados al analista en el mes actual
      const analystProjects = projects.filter(project => {
        // Verificar si el proyecto está asignado al analista
        const isAssignedToAnalyst = 
          project.analistaProducto === analyst.name ||
          (project.analistas && Array.isArray(project.analistas) && project.analistas.includes(analyst.id));

        if (!isAssignedToAnalyst) return false;

        // Verificar si el proyecto pertenece al mes actual
        const projectStartDate = project.fechaInicio ? new Date(project.fechaInicio) : null;
        const projectEndDate = project.fechaEntrega ? new Date(project.fechaEntrega) : null;
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);

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
        return total + (project.horasEstimadas || project.horas || 0);
      }, 0);

      // Calcular disponibilidad
      const usedCapacity = Math.min(totalAssignedHours / MAX_MONTHLY_HOURS, 1);
      const availabilityPercentage = Math.max(0, Math.round((1 - usedCapacity) * 100));

      availability[analyst.id] = availabilityPercentage;
    });

    return availability;
  }, [analysts, projects]);

  return { analystsAvailability };
}
