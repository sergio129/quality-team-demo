'use client';

import { useState, useEffect } from 'react';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Project } from '@/models/Project';
import { Card } from '@/components/ui/card';
import { getJiraUrl } from '@/utils/jiraUtils';

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
        // Obtener datos del analista
        const analystResponse = await fetch(`/api/analysts/${analystId}`);
        if (analystResponse.ok) {
          const analystData = await analystResponse.json();
          setAnalyst(analystData);
        }

        // Obtener proyectos asignados al analista
        const projectsResponse = await fetch(`/api/projects?analystId=${analystId}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
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
    return total + (project.horasEstimadas || 0);
  }, 0);

  const activeProjects = projects.filter(p => 
    p.estado === 'En Progreso' || p.estado === 'Por Iniciar'
  );

  const completedProjects = projects.filter(p => 
    p.estado === 'Completado' || p.estado === 'Cerrado'
  );

  // Determinar el nivel de carga
  const getWorkloadLevel = (hours: number) => {
    if (hours < 20) return { level: 'Bajo', color: 'bg-green-100 text-green-800' };
    if (hours < 40) return { level: 'Medio', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Alto', color: 'bg-red-100 text-red-800' };
  };

  const workload = getWorkloadLevel(totalHoursAssigned);

  if (loading) {
    return <div className="py-4 text-center">Cargando datos...</div>;
  }

  if (!analyst) {
    return <div className="py-4 text-center">No se encontró información del analista</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Nivel de Carga</h3>
          <div className="flex items-center mt-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${workload.color}`}>
              {workload.level}
            </div>
            <span className="ml-2 text-2xl font-semibold">{totalHoursAssigned}h</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">Horas totales asignadas</div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Proyectos Activos</h3>
          <div className="mt-2 text-2xl font-semibold">{activeProjects.length}</div>
          <div className="mt-2 text-sm text-gray-500">
            {activeProjects.length === 1 ? 'proyecto en curso' : 'proyectos en curso'}
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Disponibilidad</h3>
          <div className="mt-2 text-2xl font-semibold">{analyst.availability || 100}%</div>
          <div className="mt-2 text-sm text-gray-500">Para nuevos proyectos</div>
        </Card>
      </div>

      {/* Lista de proyectos activos */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Proyectos Asignados Actualmente</h3>
        
        {activeProjects.length > 0 ? (
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="p-3 border rounded-md shadow-sm hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{project.nombre}</div>
                    <div className="text-sm text-gray-600">{project.descripcion}</div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Célula:</span> {project.celula}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Horas:</span> {project.horasEstimadas || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Estado:</span>
                        <span 
                          className={`px-1.5 py-0.5 rounded-full text-xs ${
                            project.estado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                            project.estado === 'Por Iniciar' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.estado}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {project.idJira && (
                    <a
                      href={getJiraUrl(project.idJira)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded flex items-center"
                    >
                      {project.idJira}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No hay proyectos activos asignados a este analista
          </div>
        )}
      </div>

      {/* Proyectos completados */}
      {completedProjects.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Proyectos Completados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {completedProjects.map((project) => (
              <div
                key={project.id}
                className="p-3 border rounded-md shadow-sm bg-gray-50"
              >
                <div className="font-medium">{project.nombre}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(project.fechaFin || '').toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
