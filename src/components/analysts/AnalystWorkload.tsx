'use client';

import { useState, useEffect, useMemo } from 'react';
import { mutate } from 'swr';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Project } from '@/models/Project';
import { Card } from '@/components/ui/card';
import { getJiraUrl } from '@/utils/jiraUtils';
import { ProjectStatusButton } from '@/components/analysts/ProjectStatusButton';
import { useProjects, changeProjectStatus } from '@/hooks/useProjects'; // Importamos el hook completo y la función

interface AnalystWorkloadProps {
  analystId: string;
}

export function AnalystWorkload({ analystId }: AnalystWorkloadProps) {
  const [analyst, setAnalyst] = useState<QAAnalyst | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Usar el hook para obtener todos los proyectos
  const { projects: allProjects, isLoading: isLoadingProjects, isError: isProjectsError } = useProjects();
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
    // Filtrar proyectos actuales y próximos para cálculos de carga y visualización
  const projects = useMemo(() => {
    return allAnalystProjects.filter(project => {
      // Incluir todos los proyectos activos independientemente de la fecha de entrega
      if (project.estado === 'En Progreso' || project.estado === 'Por Iniciar') {
        return true;
      }
      
      // Verificar si el proyecto tiene fecha de entrega
      if (project.fechaEntrega) {
        const entregaDate = new Date(project.fechaEntrega);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3); // Mostrar proyectos hasta 3 meses en el futuro
        
        // Incluir proyectos del mes actual o proyectos futuros hasta 3 meses adelante
        return entregaDate <= threeMonthsFromNow;
      }
      return false;
    });
  }, [allAnalystProjects]);
  
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
  }, [analystId]);  // Usar useMemo para el cálculo de estados y proyectos filtrados
  // Esto mejora el rendimiento al evitar cálculos innecesarios en cada renderizado
  const { 
    updatedProjects,
    activeProjects,
    completedProjects,
    totalHoursAssigned
  } = useMemo(() => {    // Determinar el estado real de cada proyecto
    const updatedProjects = projects.map(p => {
      // Copiar el proyecto para no mutar el original
      const updatedProject = { ...p };
      
      // Si ya tiene un estado definido en la base de datos, usarlo
      if (p.estado) {
        // Normalizar el estado para usar nuestros estados estándar
        if (p.estado.toLowerCase().includes('progreso')) {
          updatedProject.estadoCalculado = 'En Progreso';
        } else if (p.estado.toLowerCase().includes('certificado') || 
                  p.estado.toLowerCase().includes('completado') || 
                  p.estado.toLowerCase().includes('terminado')) {
          updatedProject.estadoCalculado = 'Certificado';
        } else if (p.estado.toLowerCase().includes('iniciar')) {
          updatedProject.estadoCalculado = 'Por Iniciar';
        } else {
          // Estado desconocido, asignar un valor por defecto compatible con el tipo
          updatedProject.estadoCalculado = 'Por Iniciar';
        }
      }      // Si no tiene estado definido, calcularlo automáticamente
      else {
        // Si tiene certificación en el pasado, siempre debe estar en estado "Certificado"
        if (p.fechaCertificacion && new Date(p.fechaCertificacion) <= today) {
          updatedProject.estadoCalculado = 'Certificado';
        }
        // Si tiene fecha de inicio definida
        else if (p.fechaInicio) {
          const fechaInicio = new Date(p.fechaInicio);
          // Si la fecha de inicio es futura, está "Por Iniciar"
          if (fechaInicio > today) {
            updatedProject.estadoCalculado = 'Por Iniciar';
          }
          // Si ya pasó la fecha de inicio pero no la de entrega, está "En Progreso"
          else if (p.fechaEntrega && new Date(p.fechaEntrega) > today) {
            updatedProject.estadoCalculado = 'En Progreso';
          }
          // Si ya pasó la fecha de entrega y no tiene certificación, está "En Progreso" (con retraso)
          else {
            updatedProject.estadoCalculado = 'En Progreso';
          }
        }
        // Si no tiene fecha de inicio pero tiene fecha de entrega
        else if (p.fechaEntrega) {
          const fechaEntrega = new Date(p.fechaEntrega);
          // Si la fecha de entrega es en más de 7 días, podemos asumir "Por Iniciar"
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(today.getDate() + 7);
          
          if (fechaEntrega > sevenDaysFromNow) {
            updatedProject.estadoCalculado = 'Por Iniciar';
          } else {
            // Si la entrega es próxima o ya pasó, está "En Progreso"
            updatedProject.estadoCalculado = 'En Progreso';
          }
        }
        // Sin fechas definidas, asumimos "Por Iniciar" como valor seguro
        else {
          updatedProject.estadoCalculado = 'Por Iniciar';
        }
      }
      
      return updatedProject;
    });
      // Filtrar los proyectos por estado
    const notStartedProjects = updatedProjects.filter(p => 
      p.estadoCalculado === 'Por Iniciar'
    );
    
    const inProgressProjects = updatedProjects.filter(p => 
      p.estadoCalculado === 'En Progreso'
    );
    
    // Combinar proyectos activos (por iniciar + en progreso)
    const activeProjects = [...notStartedProjects, ...inProgressProjects];
    
    const completedProjects = updatedProjects.filter(p => 
      p.estadoCalculado === 'Certificado'
    );
      // Calcular horas asignadas (solo de proyectos activos: Por Iniciar o En Progreso)
    const totalHoursAssigned = activeProjects.reduce((total, project) => {
      return total + (project.horasEstimadas || project.horas || 0);
    }, 0);
    
    return { 
      updatedProjects, 
      activeProjects, 
      completedProjects, 
      totalHoursAssigned 
    };
  }, [projects, today]);
  // Capacidad máxima de horas mensuales
  const MAX_MONTHLY_HOURS = 180;

  // Determinar el nivel de carga
  const getWorkloadLevel = (hours: number) => {
    const percentageUsed = (hours / MAX_MONTHLY_HOURS) * 100;
    
    if (percentageUsed < 30) return { level: 'Bajo', color: 'bg-green-100 text-green-800' };
    if (percentageUsed < 70) return { level: 'Medio', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Alto', color: 'bg-red-100 text-red-800' };
  };

  const workload = getWorkloadLevel(totalHoursAssigned);
    // Calcular la disponibilidad en función de las horas asignadas
  const calculateAvailability = (hoursAssigned: number) => {
    // Asegurar que no sea negativo incluso si se sobrepasan las horas
    const usedCapacity = Math.min(hoursAssigned / MAX_MONTHLY_HOURS, 1); // No superar el 100% de uso
    // Redondear a un número entero para mostrar un porcentaje limpio
    const availabilityPercentage = Math.max(0, Math.round((1 - usedCapacity) * 100)); // No menor que 0%
    return availabilityPercentage;
  };

  // Calcular disponibilidad basada en horas del mes actual
  const availabilityPercentage = calculateAvailability(totalHoursAssigned);  // Función para actualizar el estado de un proyecto utilizando el hook useProjects
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      // Identificar si necesitamos usar el id o idJira para actualizar el proyecto
      const project = projects.find(p => p.id === projectId || p.idJira === projectId);
      
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
    // Mostrar mensaje si no hay proyectos en el mes actual
  if (projects.length === 0) {
    if (allAnalystProjects.length > 0) {
      return (
        <div className="py-4 text-center">
          <p className="text-gray-600 mb-2">No hay proyectos actuales o próximos asignados a este analista</p>
          <p className="text-sm text-gray-500">
            (El analista tiene {allAnalystProjects.length} proyecto(s) asignado(s) en otros períodos)
          </p>
        </div>
      );
    } else {
      return <div className="py-4 text-center">No hay proyectos asignados a este analista</div>;
    }
  }
    return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        <div key="workload" className={`${workload.color} p-3 rounded-lg text-center w-32`}>
          <p className="text-xs text-gray-700">Nivel de Carga</p>
          <p className="text-xl font-bold">{workload.level}</p>
          <p className="text-xs font-medium font-mono">{totalHoursAssigned}h / {MAX_MONTHLY_HOURS}h</p>
        </div>
        <div key="activeProjects" className="bg-blue-50 p-3 rounded-lg text-center w-32">
          <p className="text-xs text-gray-700">Proyectos Activos</p>
          <p className="text-xl font-bold text-blue-600">{activeProjects.length}</p>
          <p className="text-xs text-gray-500">en curso</p>
        </div>
        <div key="availability" className={`p-3 rounded-lg text-center w-32 ${
          availabilityPercentage > 70 ? 'bg-green-50' : 
          availabilityPercentage > 30 ? 'bg-yellow-50' :
          'bg-red-50'
        }`}>
          <p className="text-xs text-gray-700">Disponibilidad</p>
          <p className={`text-xl font-bold ${
            availabilityPercentage > 70 ? 'text-green-600' : 
            availabilityPercentage > 30 ? 'text-yellow-600' :
            'text-red-600'
          }`}>{availabilityPercentage}%</p>
          <p className="text-xs text-gray-500">para proyectos</p>
        </div>
      </div>      {/* Lista de proyectos activos */}      <div className="space-y-3">
        <h3 className="text-sm font-medium border-b pb-1">
          Proyectos Asignados 
          <span className="text-gray-500 ml-2 text-xs">
            Actuales y próximos
          </span>
        </h3>
        
        {activeProjects.length > 0 ? (
          <div className="space-y-2">
            {activeProjects.map((project) => (
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
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No hay proyectos asignados a este analista
          </div>
        )}
      </div>
        {/* Proyectos completados (certificados) */}
      {completedProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium border-b pb-1">
            Proyectos Certificados
            <span className="text-gray-500 ml-2 text-xs">
              {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
          </h3>          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {completedProjects.map((project) => (
              <div
                key={project.id || project.idJira}
                className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-xs">{project.nombre || project.proyecto}</div>
                  <div className="flex items-center gap-1">
                    {project.idJira && (
                      <span className="text-[10px] text-blue-600">
                        {project.idJira}
                      </span>
                    )}
                    <span className="text-[9px] bg-green-100 text-green-800 px-1 py-0.5 rounded">Certificado</span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                  <div>
                    <span className="font-medium">Certificado: </span>
                    {project.fechaCertificacion ? new Date(project.fechaCertificacion).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Horas: </span>
                    {project.horasEstimadas || project.horas || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
