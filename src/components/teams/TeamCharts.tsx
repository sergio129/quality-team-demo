'use client';

import { useTeams } from '@/hooks/useTeams';
import { useProjects, useAllProjects } from '@/hooks/useProjects';
import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function TeamCharts() {
  const { teams } = useTeams();
  const { projects } = useAllProjects();

  // Datos para el gráfico de distribución de proyectos por equipo
  const projectDistributionData = useMemo(() => {
    if (!teams.length || !projects.length) return null;

    // Contar proyectos por equipo
    const projectsByTeam = teams.map(team => {
      return {
        teamName: team.name,
        count: projects.filter(p => p.equipo === team.name).length
      };
    }).filter(team => team.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Tomar los 5 equipos con más proyectos

    return {
      labels: projectsByTeam.map(t => t.teamName),
      datasets: [
        {
          label: 'Proyectos',
          data: projectsByTeam.map(t => t.count),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [teams, projects]);

  // Datos para el gráfico de estados de proyectos
  const projectStatusData = useMemo(() => {
    if (!projects.length) return null;

    // Contar proyectos por estado
    const statusCounts = {
      'Por Iniciar': 0,
      'En Progreso': 0,
      'Certificado': 0,
      'Retrasado': 0,
      'Otro': 0
    };

    projects.forEach(project => {
      const estado = project.estado || project.estadoCalculado || '';
      const estadoLower = estado.toLowerCase();
      
      if (estadoLower.includes('iniciar') || estadoLower === 'pendiente') {
        statusCounts['Por Iniciar']++;
      } else if (estadoLower.includes('progreso') || estadoLower === 'en proceso') {
        statusCounts['En Progreso']++;
      } else if (estadoLower.includes('certificado') || estadoLower === 'completado' || 
                 estadoLower === 'terminado' || estadoLower === 'finalizado') {
        statusCounts['Certificado']++;
      } else if (estadoLower === 'retrasado') {
        statusCounts['Retrasado']++;
      } else {
        statusCounts['Otro']++;
      }
    });

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: 'Proyectos',
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(255, 206, 86, 0.6)', // Por Iniciar (amarillo)
            'rgba(54, 162, 235, 0.6)',  // En Progreso (azul)
            'rgba(75, 192, 192, 0.6)',  // Certificado (verde)
            'rgba(255, 99, 132, 0.6)',  // Retrasado (rojo)
            'rgba(153, 102, 255, 0.6)', // Otro (morado)
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [projects]);

  // Opciones para el gráfico de barras
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de proyectos por equipo',
      },
    },
  };

  if (!teams.length || !projects.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-medium mb-2">Visualización de datos</h2>
        <div className="text-center py-8 text-gray-500">
          No hay datos suficientes para mostrar gráficos
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-lg font-medium mb-4">Visualización de datos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2 text-center">Distribución de proyectos</h3>
          <div className="h-[200px] flex items-center justify-center">
            {projectDistributionData ? (
              <Bar 
                data={projectDistributionData} 
                options={barOptions} 
              />
            ) : (
              <div className="text-gray-400">No hay datos disponibles</div>
            )}
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2 text-center">Estados de proyectos</h3>
          <div className="h-[200px] flex items-center justify-center">
            {projectStatusData ? (
              <Pie 
                data={projectStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="text-gray-400">No hay datos disponibles</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
