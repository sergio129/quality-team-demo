'use client';

import { Team } from '@/models/Team';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportTeamsProps {
  teams: Team[];
}

export function ExportTeams({ teams }: ExportTeamsProps) {
  const { projects } = useProjects();
  const { analysts } = useAnalysts();

  const exportToExcel = useCallback(() => {
    // Si no hay equipos, no hacer nada
    if (!teams.length) return;

    // Definición de encabezados
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
    const dataForExcel = teams.map(team => {
      // Contar proyectos para este equipo
      const teamProjects = projects.filter(p => p.equipo === team.name);
      const activeProjects = teamProjects.filter(p => 
        p.estadoCalculado === 'En Progreso' || 
        p.estadoCalculado === 'Por Iniciar' || 
        p.estado?.toLowerCase().includes('progreso') ||
        p.estado?.toLowerCase().includes('iniciar')
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

      // Crear objeto para cada fila
      return {
        'ID': team.id,
        'Nombre': team.name,
        'Descripción': team.description || '',
        'Total Miembros': team.members?.length || 0,
        'Miembros': memberNames,
        'Proyectos Totales': teamProjects.length,
        'Proyectos Activos': activeProjects.length,
        'Proyectos Retrasados': delayedProjects.length
      };
    });

    // Crear un libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Crear una hoja de cálculo a partir de los datos
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    
    // Ajustar el ancho de las columnas para mejor legibilidad
    const columnWidths = [
      { wch: 10 },  // ID
      { wch: 25 },  // Nombre
      { wch: 40 },  // Descripción
      { wch: 15 },  // Total Miembros
      { wch: 50 },  // Miembros
      { wch: 15 },  // Proyectos Totales
      { wch: 15 },  // Proyectos Activos
      { wch: 18 },  // Proyectos Retrasados
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos');
    
    // Exportar a Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // Generar nombre del archivo con fecha actual
    const fileName = `equipos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Guardar el archivo
    saveAs(dataBlob, fileName);

  }, [teams, projects, analysts]);

  return (
    <Button 
      variant="outline"
      size="sm"
      onClick={exportToExcel}
      className="flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Exportar Excel
    </Button>
  );
}
