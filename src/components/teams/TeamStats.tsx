'use client';

import { useTeams } from '@/hooks/useTeams';
import { useProjects } from '@/hooks/useProjects';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useMemo } from 'react';

export function TeamStats() {
  const { teams } = useTeams();
  const { projects } = useProjects();
  const { analysts } = useAnalysts();

  const stats = useMemo(() => {
    // Equipo con más proyectos
    const teamProjectCount = teams.map(team => {
      const teamProjects = projects.filter(p => p.equipo === team.name);
      return {
        teamName: team.name,
        projectCount: teamProjects.length,
        activeCount: teamProjects.filter(p => 
          p.estadoCalculado === 'En Progreso' || 
          p.estado?.toLowerCase().includes('progreso')
        ).length
      };
    });

    const maxProjects = teamProjectCount.length > 0 
      ? teamProjectCount.reduce((prev, current) => (prev.projectCount > current.projectCount) ? prev : current)
      : { teamName: 'N/A', projectCount: 0, activeCount: 0 };
    
    // Equipo con más miembros
    const maxMembers = teams.length > 0
      ? teams.reduce((prev, current) => 
          ((current.members?.length || 0) > (prev.members?.length || 0)) ? current : prev
        )
      : { name: 'N/A', members: [] };

    // Promedio de carga de trabajo
    const totalActiveProjects = teamProjectCount.reduce((sum, team) => sum + team.activeCount, 0);
    const avgProjectsPerTeam = teams.length > 0 ? (totalActiveProjects / teams.length).toFixed(1) : '0';

    // Equipo más saturado
    const mostBusyTeam = teamProjectCount.length > 0 
      ? teamProjectCount.reduce((prev, current) => (prev.activeCount > current.activeCount) ? prev : current)
      : { teamName: 'N/A', activeCount: 0 };

    // Total de miembros
    const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    
    return {
      totalTeams: teams.length,
      totalProjects: projects.length,
      totalMembers,
      maxProjects,
      maxMembers,
      avgProjectsPerTeam,
      mostBusyTeam
    };
  }, [teams, projects, analysts]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-lg font-medium mb-4">Estadísticas de Equipos</h2>
      
      <div className="divide-y">
        <div className="py-2 flex justify-between">
          <span className="text-sm text-gray-600">Total equipos:</span>
          <span className="font-medium">{stats.totalTeams}</span>
        </div>
        
        <div className="py-2 flex justify-between">
          <span className="text-sm text-gray-600">Total miembros asignados:</span>
          <span className="font-medium">{stats.totalMembers}</span>
        </div>

        <div className="py-2 flex justify-between">
          <span className="text-sm text-gray-600">Proyectos por equipo (promedio):</span>
          <span className="font-medium">{stats.avgProjectsPerTeam}</span>
        </div>
        
        <div className="py-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Equipo con más proyectos:</span>
            <span className="font-medium">{stats.maxProjects.teamName}</span>
          </div>
          <div className="text-xs text-right text-gray-500">
            {stats.maxProjects.projectCount} proyectos ({stats.maxProjects.activeCount} activos)
          </div>
        </div>
        
        <div className="py-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Equipo con más miembros:</span>
            <span className="font-medium">{stats.maxMembers.name}</span>
          </div>
          <div className="text-xs text-right text-gray-500">
            {stats.maxMembers.members?.length || 0} integrantes
          </div>
        </div>
        
        <div className="py-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Equipo más ocupado:</span>
            <span className="font-medium">{stats.mostBusyTeam.teamName}</span>
          </div>
          <div className="text-xs text-right text-gray-500">
            {stats.mostBusyTeam.activeCount} proyectos activos
          </div>
        </div>
      </div>
    </div>
  );
}
