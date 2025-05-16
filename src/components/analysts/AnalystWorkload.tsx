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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        <div className={`${workload.color.replace('bg-', 'bg-').replace('text-', 'text-')} p-3 rounded-lg text-center w-32`}>
          <p className="text-xs text-gray-700">Nivel de Carga</p>
          <p className="text-xl font-bold">{workload.level}</p>
          <p className="text-xs font-medium">{totalHoursAssigned}h</p>
        </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center w-32">
          <p className="text-xs text-gray-700">Proyectos Activos</p>
          <p className="text-xl font-bold text-blue-600">{activeProjects.length}</p>
          <p className="text-xs text-gray-500">en curso</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg text-center w-32">
          <p className="text-xs text-gray-700">Disponibilidad</p>
          <p className="text-xl font-bold text-green-600">{analyst.availability || 100}%</p>
          <p className="text-xs text-gray-500">para proyectos</p>
        </div>
      </div>

      {/* Lista de proyectos activos */}      <div className="space-y-3">
        <h3 className="text-sm font-medium border-b pb-1">Proyectos Asignados</h3>
        
        {activeProjects.length > 0 ? (
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="p-2 border rounded-md shadow-sm hover:bg-gray-50 text-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{project.nombre}</div>
                    <div className="text-xs text-gray-600 line-clamp-1">{project.descripcion}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Célula:</span> {project.celula}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Horas:</span> {project.horasEstimadas || 'N/A'}
                      </span>                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Estado:</span>
                        <span 
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
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
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center"
                    >
                      {project.idJira}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No hay proyectos asignados a este analista
          </div>
        )}
      </div>

      {/* Proyectos completados */}
      {completedProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium border-b pb-1">Proyectos Completados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {completedProjects.map((project) => (
              <div
                key={project.id}
                className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
              >
                <div className="font-medium text-xs">{project.nombre}</div>
                <div className="mt-1 text-[10px] text-gray-500">
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
