'use client';

import { Team } from '@/models/Team';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useCallback } from 'react';

interface ExportTeamsProps {
  teams: Team[];
}

export function ExportTeams({ teams }: ExportTeamsProps) {
  const { projects } = useProjects();
  const { analysts } = useAnalysts();

  const generateCSV = useCallback(() => {
    // Si no hay equipos, no hacer nada
    if (!teams.length) return;

    // Encabezados del CSV
    const headers = [
      'ID', 
      'Nombre', 
      'Descripción', 
      'Total Miembros', 
      'Miembros', 
      'Proyectos Totales', 
      'Proyectos Activos', 
      'Proyectos Retrasados'
    ];

    // Preparar datos de los equipos
    const rows = teams.map(team => {
      // Contar proyectos para este equipo
      const teamProjects = projects.filter(p => p.equipo === team.name);
      const activeProjects = teamProjects.filter(p => 
        p.estadoCalculado === 'En Progreso' || 
        p.estado?.toLowerCase().includes('progreso')
      );
      const delayedProjects = teamProjects.filter(p => 
        p.estado?.toLowerCase() === 'retrasado' ||
        (p.diasRetraso && p.diasRetraso > 0)
      );

      // Obtener nombres de miembros
      const memberNames = team.members?.map(memberId => {
        const analyst = analysts.find(a => a.id === memberId);
        return analyst?.name || 'Desconocido';
      }).join(', ') || '';

      return [
        team.id,
        team.name,
        team.description || '',
        team.members?.length || 0,
        memberNames,
        teamProjects.length,
        activeProjects.length,
        delayedProjects.length
      ];
    });

    // Crear contenido del CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Crear un blob y un link para descargarlo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `equipos_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }, [teams, projects, analysts]);

  return (
    <Button 
      variant="outline"
      size="sm"
      onClick={generateCSV}
      className="flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Exportar CSV
    </Button>
  );
}
