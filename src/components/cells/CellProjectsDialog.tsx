'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Cell } from '@/models/Cell';
import { Project } from '@/models/Project';
import { useProjects } from '@/hooks/useProjects';
import { getJiraUrl } from '@/utils/jiraUtils';
import { ChangeProjectStatusDialog } from '../projects/ChangeProjectStatusDialog';

interface CellProjectsDialogProps {
  cell: Cell;
  isOpen: boolean;
  onClose: () => void;
}

export function CellProjectsDialog({ cell, isOpen, onClose }: CellProjectsDialogProps) {
  const { projects, isLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filtrar proyectos por la célula actual
  const cellProjects = useMemo(() => {
    return projects.filter(project => 
      project.celula?.toLowerCase() === cell.name.toLowerCase()
    );
  }, [projects, cell.name]);

  // Filtrar proyectos por término de búsqueda
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return cellProjects;
    
    const searchLower = searchTerm.toLowerCase();
    return cellProjects.filter(project => 
      project.proyecto.toLowerCase().includes(searchLower) ||
      project.idJira.toLowerCase().includes(searchLower) ||
      project.descripcion?.toLowerCase().includes(searchLower) ||
      project.estado?.toLowerCase().includes(searchLower)
    );
  }, [cellProjects, searchTerm]);

  // Obtener estado en formato legible y su clase CSS
  const getStatusInfo = (project: any) => {
    const estado = project.estado || project.estadoCalculado || 'Por Iniciar';
    
    let statusClass = 'bg-gray-100 text-gray-800';
    if (estado.includes('Progreso') || estado === 'En Progreso') {
      statusClass = 'bg-blue-100 text-blue-800';
    } else if (estado.includes('Certificado') || estado === 'Completado' || estado === 'Terminado') {
      statusClass = 'bg-green-100 text-green-800';
    } else if (estado.includes('Iniciar') || estado === 'Por Iniciar') {
      statusClass = 'bg-yellow-100 text-yellow-800';
    }
    
    return { text: estado, className: statusClass };
  };

  // Formatear fecha para visualización
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Proyectos de célula: {cell.name}</DialogTitle>
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
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2">Cargando proyectos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <p className="text-gray-500">No hay proyectos asignados a esta célula</p>
            </div>          ) : (
            <div className="border rounded-md max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>ID Jira</TableHead>
                    <TableHead>Proyecto</TableHead>
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
                        </TableCell>                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                              {status.text}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se cierre el diálogo principal
                                setSelectedProject(project);
                                setStatusDialogOpen(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </Button>
                          </div>
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
        
        {selectedProject && (
          <ChangeProjectStatusDialog
            project={selectedProject}
            isOpen={statusDialogOpen}
            onClose={() => {
              setStatusDialogOpen(false);
              setSelectedProject(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
