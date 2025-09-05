'use client';

import { useState, useEffect, useMemo } from 'react';
import { mutate } from 'swr';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Project } from '@/models/Project';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getJiraUrl } from '@/utils/jiraUtils';
import { ProjectStatusButton } from '@/components/analysts/ProjectStatusButton';
import { useProjects, useAllProjects, changeProjectStatus } from '@/hooks/useProjects';
import {
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Target
} from 'lucide-react';

interface AnalystWorkloadProps {
  analystId: string;
}

export function AnalystWorkload({ analystId }: AnalystWorkloadProps) {
  const [analyst, setAnalyst] = useState<QAAnalyst | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'month' | 'week' | 'history'>('current');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
  
  // Usar el hook para obtener todos los proyectos
  const { projects: allProjects, isLoading: isLoadingProjects, isError: isProjectsError } = useAllProjects();
    // Usar la fecha actual del sistema
  const today = new Date(); // Fecha actual
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  // Filtrar todos los proyectos asignados al analista (independiente de la fecha)
  const allAnalystProjects = useMemo(() => {
    if (!analystId || !allProjects?.length) return [];
    
    return allProjects.filter(project => {
      // Verificar si el proyecto está asignado al analista de cualquier forma posible
      const isAssignedToAnalyst = 
        // Por nombre de analista en el campo analistaProducto
        (analyst && project.analistaProducto && project.analistaProducto === analyst.name) ||
        // Por ID de analista en un array de analistas (si existe)
        (project.analistas && Array.isArray(project.analistas) && project.analistas.includes(analystId));
      
      return isAssignedToAnalyst;
    });
  }, [analystId, allProjects, analyst]);
  // Función para determinar si un proyecto pertenece a un período específico
  const isProjectInPeriod = (project: Project, period: 'current' | 'month' | 'week' | 'history', month?: number, year?: number) => {
    const projectStatus = getCalculatedStatus(project);

    // Para proyectos certificados, usar fecha de certificación
    if (projectStatus === 'Certificado' && project.fechaCertificacion) {
      const certDate = new Date(project.fechaCertificacion);
      const certMonth = certDate.getMonth();
      const certYear = certDate.getFullYear();

      switch (period) {
        case 'current':
          return certMonth === currentMonth && certYear === currentYear;
        case 'month':
          return certMonth === (month ?? currentMonth) && certYear === (year ?? currentYear);
        case 'week':
          // Para semana, verificar si la certificación fue en la semana actual
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return certDate >= weekStart && certDate <= weekEnd;
        case 'history':
          return true; // Mostrar todos los proyectos históricos
        default:
          return false;
      }
    }

    // Para proyectos activos, usar fecha de entrega o inicio
    const relevantDate = project.fechaEntrega || project.fechaInicio;
    if (!relevantDate) return period === 'current' || period === 'history';

    const projectDate = new Date(relevantDate);
    const projectMonth = projectDate.getMonth();
    const projectYear = projectDate.getFullYear();

    switch (period) {
      case 'current':
        return projectMonth === currentMonth && projectYear === currentYear;
      case 'month':
        return projectMonth === (month ?? currentMonth) && projectYear === (year ?? currentYear);
      case 'week':
        // Para semana, verificar si la fecha relevante está en la semana actual
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return projectDate >= weekStart && projectDate <= weekEnd;
      case 'history':
        return true; // Mostrar todos los proyectos
      default:
        return false;
    }
  };

  // Función para determinar el estado calculado de un proyecto
  const getCalculatedStatus = (project: Project) => {
    // Si ya tiene un estado definido en la base de datos, usarlo
    if (project.estado) {
      // Normalizar el estado para usar nuestros estados estándar
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
    else {
      // Si tiene certificación en el pasado, siempre debe estar en estado "Certificado"
      if (project.fechaCertificacion && new Date(project.fechaCertificacion) <= today) {
        return 'Certificado';
      }
      // Si tiene fecha de inicio definida
      else if (project.fechaInicio) {
        const fechaInicio = new Date(project.fechaInicio);
        // Si la fecha de inicio es futura, está "Por Iniciar"
        if (fechaInicio > today) {
          return 'Por Iniciar';
        }
        // Si ya pasó la fecha de inicio pero no la de entrega, está "En Progreso"
        else if (project.fechaEntrega && new Date(project.fechaEntrega) > today) {
          return 'En Progreso';
        }
        // Si ya pasó la fecha de entrega y no tiene certificación, está "En Progreso" (con retraso)
        else {
          return 'En Progreso';
        }
      }
      // Si no tiene fecha de inicio pero tiene fecha de entrega
      else if (project.fechaEntrega) {
        const fechaEntrega = new Date(project.fechaEntrega);
        // Si la entrega es en más de 7 días, podemos asumir "Por Iniciar"
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        if (fechaEntrega > sevenDaysFromNow) {
          return 'Por Iniciar';
        } else {
          return 'En Progreso';
        }
      }
      // Sin fechas definidas, asumimos "Por Iniciar" como valor seguro
      else {
        return 'Por Iniciar';
      }
    }
  };
  
  // Obtener datos del analista
  useEffect(() => {
    const fetchAnalyst = async () => {
      setLoading(true);
      try {
        const analystResponse = await fetch(`/api/analysts/${analystId}`);
        if (analystResponse.ok) {
          const analystData = await analystResponse.json();
          setAnalyst(analystData);
        }
      } catch (error) {
        console.error('Error fetching analyst data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (analystId) {
      fetchAnalyst();
    }
  }, [analystId]);

  // Calcular carga laboral por período - INCLUYENDO TODOS LOS PROYECTOS
  const workloadData = useMemo(() => {
    const filteredProjects = allAnalystProjects.filter(project =>
      isProjectInPeriod(project, selectedPeriod, selectedMonth, selectedYear)
    );

    // INCLUIR TODOS LOS PROYECTOS para cálculo de carga laboral real
    const allProjectsInPeriod = filteredProjects;

    // Separar por estado para visualización
    const activeProjects = filteredProjects.filter(project => {
      const status = getCalculatedStatus(project);
      return status === 'Por Iniciar' || status === 'En Progreso';
    });

    const completedProjects = filteredProjects.filter(project =>
      getCalculatedStatus(project) === 'Certificado'
    );

    // Calcular TODAS las horas asignadas (incluyendo proyectos certificados)
    const totalAssignedHours = allProjectsInPeriod.reduce((total, project) =>
      total + (project.horasEstimadas || project.horas || 0), 0
    );

    // Calcular horas por estado
    const activeHours = activeProjects.reduce((total, project) =>
      total + (project.horasEstimadas || project.horas || 0), 0
    );

    const completedHours = completedProjects.reduce((total, project) =>
      total + (project.horasEstimadas || project.horas || 0), 0
    );

    return {
      filteredProjects,
      allProjectsInPeriod,
      activeProjects,
      completedProjects,
      totalAssignedHours, // TODAS las horas asignadas
      activeHours,
      completedHours,
      totalHours: activeHours + completedHours
    };
  }, [allAnalystProjects, selectedPeriod, selectedMonth, selectedYear, currentMonth, currentYear, today]);
  // Capacidad máxima de horas según período
  const MAX_MONTHLY_HOURS = 180;
  const MAX_WEEKLY_HOURS = 44; // 5 días x 8.8 horas promedio
  const MAX_YEARLY_HOURS = 2228; // Capacidad anual total

  // Función para obtener la capacidad máxima según el período
  const getMaxHoursForPeriod = (period: 'current' | 'month' | 'week' | 'history') => {
    switch (period) {
      case 'week':
        return MAX_WEEKLY_HOURS;
      case 'history':
        return MAX_YEARLY_HOURS;
      default:
        return MAX_MONTHLY_HOURS;
    }
  };

  // Determinar el nivel de carga
  const getWorkloadLevel = (hours: number, period: 'current' | 'month' | 'week' | 'history') => {
    const maxHours = getMaxHoursForPeriod(period);
    const percentageUsed = (hours / maxHours) * 100;

    if (percentageUsed < 30) return { level: 'Bajo', color: 'bg-green-100 text-green-800' };
    if (percentageUsed < 70) return { level: 'Medio', color: 'bg-yellow-100 text-yellow-800' };
    if (percentageUsed < 100) return { level: 'Alto', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Sobrecarga', color: 'bg-red-100 text-red-800' };
  };

  // Calcular disponibilidad
  const calculateAvailability = (hoursAssigned: number, period: 'current' | 'month' | 'week' | 'history') => {
    const maxHours = getMaxHoursForPeriod(period);
    const usedCapacity = Math.min(hoursAssigned / maxHours, 1);
    const availabilityPercentage = Math.max(0, Math.round((1 - usedCapacity) * 100));
    return availabilityPercentage;
  };

  // Determinar el nivel de carga basado en TODAS las horas asignadas
  const workload = getWorkloadLevel(workloadData.totalAssignedHours, selectedPeriod);

  // Calcular disponibilidad basada en TODAS las horas asignadas
  const availabilityPercentage = calculateAvailability(workloadData.totalAssignedHours, selectedPeriod);

  // Función para cambiar período
  const changePeriod = (direction: 'prev' | 'next') => {
    if (selectedPeriod === 'month') {
      const newDate = new Date(selectedYear, selectedMonth + (direction === 'next' ? 1 : -1), 1);
      setSelectedMonth(newDate.getMonth());
      setSelectedYear(newDate.getFullYear());
    } else if (selectedPeriod === 'week') {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + (direction === 'next' ? 7 : -7));
      setSelectedMonth(newDate.getMonth());
      setSelectedYear(newDate.getFullYear());
    }
  };

  // Resetear filtros cuando cambia el período
  useEffect(() => {
    setShowAllProjects(false);
  }, [selectedPeriod, selectedMonth, selectedYear]);

  // Función para obtener nombre del período actual
  const getPeriodName = () => {
    switch (selectedPeriod) {
      case 'current':
        return `Mes Actual (${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`;
      case 'month':
        return new Date(selectedYear, selectedMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      case 'week':
        return `Semana del ${today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
      case 'history':
        return 'Histórico Completo';
      default:
        return '';
    }
  };
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      // Identificar si necesitamos usar el id o idJira para actualizar el proyecto
      const project = allAnalystProjects.find(p => p.id === projectId || p.idJira === projectId);
      
      if (!project) {
        console.error('Proyecto no encontrado:', projectId);
        return false;
      }
      
      // Actualización optimista de la UI
      // Creamos una copia localizada del proyecto con el nuevo estado para mostrar cambios inmediatos
      const optimisticProject = { ...project, estadoCalculado: newStatus, estado: newStatus };
      
      // Usar la función del hook que incluye notificaciones, revalidaciones y manejo de errores
      await changeProjectStatus(
        project.id || projectId, 
        newStatus,
        project.idJira // Pasar el idJira como tercer parámetro
      );
      
      // Forzar revalidación inmediata y completa de los datos
      await mutate('/api/projects');
      
      // Forzar una recarga completa de datos después de actualizar el estado
      if (analystId) {
        setLoading(true);
        // Refrescar los datos del analista para obtener los proyectos actualizados
        try {
          const analystResponse = await fetch(`/api/analysts/${analystId}`);
          if (analystResponse.ok) {
            const analystData = await analystResponse.json();
            setAnalyst(analystData);
          }
        } catch (error) {
          console.error('Error al actualizar datos del analista:', error);
        } finally {
          setLoading(false);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      // Revertir la actualización optimista en caso de error
      await mutate('/api/projects');
      return false;
    }
  };
  // Mostrar mensaje de carga mientras se obtienen los datos
  if (loading || isLoadingProjects) {
    return <div className="py-4 text-center">Cargando datos...</div>;
  }
  
  // Mostrar mensaje de error si hay algún problema
  if (isProjectsError) {
    return <div className="py-4 text-center text-red-500">Error al cargar los proyectos</div>;
  }
  
  // Mostrar mensaje si no se encuentra el analista
  if (!analyst) {
    return <div className="py-4 text-center">No se encontró información del analista</div>;
  }
  // Mostrar mensaje si no hay proyectos activos, pero permitir ver todos los proyectos
  const shouldShowAllProjectsView = workloadData.activeProjects.length === 0 && allAnalystProjects.length > 0;
    return (
    <div className="space-y-6">
      {/* Controles de Filtro y Período */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Análisis de Carga Laboral</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Selector de período */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'current' | 'month' | 'week' | 'history')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="current">Mes Actual</option>
                <option value="month">Mes Específico</option>
                <option value="week">Esta Semana</option>
                <option value="history">Histórico</option>
              </select>
            </div>

            {/* Controles de navegación para mes/semana */}
            {(selectedPeriod === 'month' || selectedPeriod === 'week') && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePeriod('prev')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Badge variant="secondary" className="px-3 py-1">
                  {getPeriodName()}
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePeriod('next')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Información del período actual */}
            {selectedPeriod === 'current' && (
              <Badge variant="secondary" className="px-3 py-1">
                {getPeriodName()}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Métricas de Carga Laboral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div key="workload" className={`${workload.color} p-3 rounded-lg text-center`}>
          <p className="text-xs text-gray-700">Nivel de Carga</p>
          <p className="text-lg sm:text-xl font-bold">{workload.level}</p>
          <p className="text-xs font-medium font-mono">{workloadData.totalAssignedHours}h / {getMaxHoursForPeriod(selectedPeriod)}h</p>
        </div>
        <div key="activeProjects" className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-700">Proyectos Activos</p>
          <p className="text-lg sm:text-xl font-bold text-blue-600">{workloadData.activeProjects.length}</p>
          <p className="text-xs text-gray-500">en curso</p>
        </div>
        <div key="totalProjects" className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-700">Total Proyectos</p>
          <p className="text-lg sm:text-xl font-bold text-purple-600">{workloadData.allProjectsInPeriod.length}</p>
          <p className="text-xs text-gray-500">todos los estados</p>
        </div>
        <div key="availability" className={`p-3 rounded-lg text-center ${
          availabilityPercentage > 70 ? 'bg-green-50' :
          availabilityPercentage > 30 ? 'bg-yellow-50' :
          'bg-red-50'
        }`}>
          <p className="text-xs text-gray-700">Disponibilidad</p>
          <p className={`text-lg sm:text-xl font-bold ${
            availabilityPercentage > 70 ? 'text-green-600' :
            availabilityPercentage > 30 ? 'text-yellow-600' :
            'text-red-600'
          }`}>{availabilityPercentage}%</p>
          <p className="text-xs text-gray-500">para proyectos</p>
        </div>
      </div>

      {/* Lista de proyectos */}  
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-1">
          <h3 className="text-sm font-medium">
            Proyectos Asignados 
            <span className="text-gray-500 ml-2 text-xs">
              {showAllProjects ? 'Todos los proyectos' : getPeriodName()}
            </span>
          </h3>
          
          {/* Controles de filtro */}
          <div className="flex items-center gap-2">
            {allAnalystProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllProjects(!showAllProjects)}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                {showAllProjects ? 'Ver solo activos' : 'Ver todos los proyectos'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Determinar qué proyectos mostrar */}
        {(() => {
          const projectsToShow = showAllProjects ? allAnalystProjects : workloadData.filteredProjects;
          
          if (projectsToShow.length > 0) {
            return (
              <div className="space-y-2">
                {projectsToShow.map((project) => (
                  <div
                    key={project.id || project.idJira}
                    className="p-2 border rounded-md shadow-sm hover:bg-gray-50 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{project.nombre || project.proyecto}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">{project.descripcion}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="text-gray-500">Célula:</span> {project.celula}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-gray-500">Horas:</span> {project.horasEstimadas || project.horas || 'N/A'}
                          </span>                      <span className="flex items-center gap-1">
                            <span className="text-gray-500">Estado:</span>
                            <span 
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                project.estadoCalculado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                                project.estadoCalculado === 'Por Iniciar' ? 'bg-amber-100 text-amber-800' :
                                project.estadoCalculado === 'Certificado' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {project.estadoCalculado}
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">                    {project.idJira && (
                          <a
                            href={getJiraUrl(project.idJira)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center"
                          >
                            {project.idJira}
                          </a>
                        )}
                        <ProjectStatusButton 
                          project={project} 
                          onStatusChange={handleStatusChange} 
                        />
                      </div>
                    </div>              </div>
                ))}
              </div>
            );
          } else if (allAnalystProjects.length > 0) {
            // No hay proyectos en la vista actual pero sí hay proyectos asignados
            return (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-2">
                  {showAllProjects ? 'No hay proyectos en esta vista' : 'No hay proyectos activos asignados al analista'}
                </p>
                <p className="text-xs text-gray-400">
                  (El analista tiene {allAnalystProjects.length} proyecto(s) asignado(s) en total)
                </p>
                {!showAllProjects && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllProjects(true)}
                    className="mt-2 text-xs"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Ver todos los proyectos
                  </Button>
                )}
              </div>
            );
          } else {
            // No hay proyectos asignados en absoluto
            return (
              <div className="text-center py-4 text-gray-500 text-sm">
                No hay proyectos asignados a este analista
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
