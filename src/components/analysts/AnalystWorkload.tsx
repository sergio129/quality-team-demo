'use client';

import { useState, useEffect } from 'react';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Project } from '@/models/Project';
import { Card } from '@/components/ui/card';
import { getJiraUrl } from '@/utils/jiraUtils';
import { ChangeProjectStatusDialog } from '@/components/projects/ChangeProjectStatusDialog';

interface AnalystWorkloadProps {
  analystId: string;
}

export function AnalystWorkload({ analystId }: AnalystWorkloadProps) {
  const [analyst, setAnalyst] = useState<QAAnalyst | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // NOTA: En este ambiente de desarrollo usamos una fecha simulada 
        // Para producción, descomentar la línea de abajo y comentar la siguiente
        // const today = new Date(); 
        const today = new Date("2025-05-16"); // Fecha simulada para desarrollo
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        console.log(`Fetching projects for month: ${currentMonth}, year: ${currentYear}`);

        // Obtener datos del analista
        const analystResponse = await fetch(`/api/analysts/${analystId}`);
        if (analystResponse.ok) {
          const analystData = await analystResponse.json();
          setAnalyst(analystData);
          
          // Obtener proyectos asignados al analista del mes actual (usando ID, nombre y filtro de fecha)
          const projectsUrl = `/api/projects?analystId=${analystId}&analystName=${encodeURIComponent(analystData.name)}&month=${currentMonth}&year=${currentYear}`;
          console.log(`Fetching from: ${projectsUrl}`);
          const projectsResponse = await fetch(projectsUrl);
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            console.log(`Received ${projectsData.length} projects:`, projectsData);
            setProjects(projectsData);
          }
        } else {
          // Si no se puede obtener el analista, intentar con solo el ID
          const projectsUrl = `/api/projects?analystId=${analystId}&month=${currentMonth}&year=${currentYear}`;
          console.log(`Fallback fetching from: ${projectsUrl}`);
          const projectsResponse = await fetch(projectsUrl);
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            console.log(`Received ${projectsData.length} projects:`, projectsData);
            setProjects(projectsData);
          }
        }
      } catch (error) {
        console.error('Error fetching analyst workload:', error);
      } finally {
        setLoading(false);
      }
    };

    if (analystId) {
      fetchData();
    }
  }, [analystId]);
  // Calcular estadísticas de carga de trabajo
  const totalHoursAssigned = projects.reduce((total, project) => {
    return total + (project.horasEstimadas || project.horas || 0);
  }, 0);
  // Determinar el estado real de cada proyecto y actualizar la lista
  const today = new Date(); // Usar la fecha actual para comparaciones
  
  // Determinar el estado real de cada proyecto
  const updatedProjects = projects.map(p => {
    // Copiar el proyecto para no mutar el original
    const updatedProject = { ...p };
    
    // Si tiene certificación en el pasado, siempre debe estar en estado "Certificado"
    if (p.fechaCertificacion && new Date(p.fechaCertificacion) <= today) {
      updatedProject.estadoCalculado = 'Certificado';
    }
    // Si la fecha de entrega es en el futuro, está "Por Iniciar"
    else if (new Date(p.fechaEntrega) > today) {
      updatedProject.estadoCalculado = 'Por Iniciar';
    }
    // De lo contrario, está "En Progreso"
    else {
      updatedProject.estadoCalculado = 'En Progreso';
    }
    
    return updatedProject;
  });
  
  // Filtrar los proyectos activos: Por Iniciar o En Progreso
  const activeProjects = updatedProjects.filter(p => 
    p.estadoCalculado === 'Por Iniciar' || p.estadoCalculado === 'En Progreso'
  );

  // Filtrar los proyectos completados (certificados)
  const completedProjects = updatedProjects.filter(p => 
    p.estadoCalculado === 'Certificado'
  );
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
    const usedCapacity = Math.min(hoursAssigned / MAX_MONTHLY_HOURS, 1); // No superar 100%
    const availabilityPercentage = Math.max(0, Math.round((1 - usedCapacity) * 100)); // No menor que 0%
    return availabilityPercentage;
  };
    const availabilityPercentage = calculateAvailability(totalHoursAssigned);
  
  // Función para actualizar el estado de un proyecto
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/projects/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, newStatus }),
      });
      
      if (response.ok) {
        // Actualizar el estado localmente para evitar tener que recargar
        const updatedList = updatedProjects.map(p => {
          if ((p.id && p.id === projectId) || p.idJira === projectId) {
            return {
              ...p,
              estado: newStatus,
              estadoCalculado: newStatus,
              // Si se certificó, agregar la fecha de certificación
              ...(newStatus === 'Certificado' && { fechaCertificacion: new Date().toISOString() })
            };
          }
          return p;
        });
        
        // Recalcular los proyectos activos y completados
        const newActiveProjects = updatedList.filter(p => 
          p.estadoCalculado === 'Por Iniciar' || p.estadoCalculado === 'En Progreso'
        );
        
        const newCompletedProjects = updatedList.filter(p => 
          p.estadoCalculado === 'Certificado'
        );
        
        // Actualizar el estado
        setProjects(updatedList);
        
        return true;
      } else {
        console.error('Error al cambiar el estado del proyecto');
        return false;
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      return false;
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Cargando datos...</div>;
  }
  if (!analyst) {
    return <div className="py-4 text-center">No se encontró información del analista</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        <div className={`${workload.color.replace('bg-', 'bg-').replace('text-', 'text-')} p-3 rounded-lg text-center w-32`}>
          <p className="text-xs text-gray-700">Nivel de Carga</p>
          <p className="text-xl font-bold">{workload.level}</p>
          <p className="text-xs font-medium">{totalHoursAssigned}h / {MAX_MONTHLY_HOURS}h</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center w-32">
          <p className="text-xs text-gray-700">Proyectos Activos</p>
          <p className="text-xl font-bold text-blue-600">{activeProjects.length}</p>
          <p className="text-xs text-gray-500">en curso</p>
        </div>
        <div className={`p-3 rounded-lg text-center w-32 ${
          availabilityPercentage > 70 ? 'bg-green-50' : 
          availabilityPercentage > 30 ? 'bg-yellow-50' :
          'bg-red-50'
        }`}>
          <p className="text-xs text-gray-700">Disponibilidad</p>
          <p className={`text-xl font-bold ${
            availabilityPercentage > 70 ? 'text-green-600' : 
            availabilityPercentage > 30 ? 'text-yellow-600' :
            'text-red-600'
          }`}>{availabilityPercentage}%</p>          <p className="text-xs text-gray-500">para proyectos</p>
        </div>
      </div>

      {/* Lista de proyectos activos */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium border-b pb-1">Proyectos Asignados</h3>
        
        {activeProjects.length > 0 ? (
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="p-2 border rounded-md shadow-sm hover:bg-gray-50 text-sm"
              >
                <div className="flex justify-between items-start">
                  <div>                    <div className="font-medium">{project.nombre || project.proyecto}</div>
                    <div className="text-xs text-gray-600 line-clamp-1">{project.descripcion}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Célula:</span> {project.celula}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Horas:</span> {project.horasEstimadas || project.horas || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Estado:</span>
                        <span 
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            project.estadoCalculado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                            project.estadoCalculado === 'Por Iniciar' ? 'bg-amber-100 text-amber-800' :
                            project.estadoCalculado === 'Certificado' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.estadoCalculado}                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {project.idJira && (
                      <a
                        href={getJiraUrl(project.idJira)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center"
                      >
                        {project.idJira}
                      </a>
                    )}                    <ChangeProjectStatusDialog 
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
          <h3 className="text-sm font-medium border-b pb-1">Proyectos Certificados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {completedProjects.map((project) => (
              <div
                key={project.id}
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
