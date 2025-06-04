'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Team } from '@/models/Team';
import { useProjects } from '@/hooks/useProjects';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getJiraUrl } from '@/utils/jiraUtils';

interface TeamProjectsDialogProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamProjectsDialog({ team, isOpen, onClose }: TeamProjectsDialogProps) {
  const { projects, isLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar proyectos por equipo
  const teamProjects = useMemo(() => {
    return projects.filter(project => 
      project.equipo?.toLowerCase() === team.name.toLowerCase()
    );
  }, [projects, team.name]);

  // Filtrar proyectos por término de búsqueda
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return teamProjects;
    
    const searchLower = searchTerm.toLowerCase();
    return teamProjects.filter(project => 
      project.proyecto.toLowerCase().includes(searchLower) ||
      project.idJira.toLowerCase().includes(searchLower) ||
      project.descripcion?.toLowerCase().includes(searchLower) ||
      project.estado?.toLowerCase().includes(searchLower) ||
      project.celula?.toLowerCase().includes(searchLower)
    );
  }, [teamProjects, searchTerm]);

  // Obtener estado en formato legible y su clase CSS
  const getStatusInfo = (project: any) => {
    const estado = project.estado || project.estadoCalculado || 'Por Iniciar';
    const estadoLower = estado.toLowerCase();
    
    let statusClass = 'bg-gray-100 text-gray-800'; // Default

    if (estadoLower.includes('progreso') || estadoLower === 'en proceso') {
      statusClass = 'bg-blue-100 text-blue-800';
    } else if (estadoLower.includes('certificado') || estadoLower === 'completado') {
      statusClass = 'bg-green-100 text-green-800';
    } else if (estadoLower.includes('iniciar') || estadoLower === 'pendiente') {
      statusClass = 'bg-yellow-100 text-yellow-800';
    } else if (estadoLower === 'retrasado') {
      statusClass = 'bg-red-100 text-red-800';
    }
    
    return { text: estado, className: statusClass };
  };

  // Formatear fecha para visualización
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Proyectos del Equipo: {team.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center pb-4">
            <Input
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
              <p className="mt-2">Cargando proyectos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <p className="text-gray-500">No hay proyectos asignados a este equipo</p>
            </div>
          ) : (
            <div className="border rounded-md max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>ID Jira</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Célula</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Analista</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project, index) => {
                    const status = getStatusInfo(project);
                    
                    return (
                      <TableRow key={`${project.id || project.idJira}-${index}`}>
                        <TableCell>
                          <a 
                            href={getJiraUrl(project.idJira)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {project.idJira}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.proyecto}</div>
                            {project.descripcion && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {project.descripcion}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{project.celula}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                            {status.text}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(project.fechaEntrega)}</TableCell>
                        <TableCell>{project.analista || project.analistaProducto || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-4">
            Total: {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
