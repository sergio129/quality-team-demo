'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Team } from '@/models/Team';
import { useProjects } from '@/hooks/useProjects';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getJiraUrl } from '@/utils/jiraUtils';

interface TeamProjectsDialogProps {
  readonly team: Team;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function TeamProjectsDialog({ team, isOpen, onClose }: TeamProjectsDialogProps) {
  const { projects, isLoading } = useProjects({ limit: 500 }); // Usar límite alto para obtener todos los proyectos
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar proyectos por equipo
  const teamProjects = useMemo(() => {
    return projects.filter(project => 
      project.equipo?.toLowerCase() === team.name.toLowerCase()
    );
  }, [projects, team.name]);

  // Agregar una opción para mostrar solo proyectos activos
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Filtrar proyectos activos si está activado el filtro
  const activeFilteredProjects = useMemo(() => {
    if (!showOnlyActive) return teamProjects;
    
    return teamProjects.filter(project => {
      return project.estadoCalculado === 'En Progreso' || 
             project.estadoCalculado === 'Por Iniciar' || 
             project.estado === 'en progreso' || 
             (project.estado && project.estado.toLowerCase().includes('iniciar'));
    });
  }, [teamProjects, showOnlyActive]);

  // Filtrar proyectos por término de búsqueda
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return activeFilteredProjects;
    
    const searchLower = searchTerm.toLowerCase();
    return activeFilteredProjects.filter(project => 
      project.proyecto.toLowerCase().includes(searchLower) ||
      project.idJira.toLowerCase().includes(searchLower) ||
      project.descripcion?.toLowerCase().includes(searchLower) ||
      project.estado?.toLowerCase().includes(searchLower) ||
      project.celula?.toLowerCase().includes(searchLower)
    );
  }, [activeFilteredProjects, searchTerm]);
  
  // Obtener estado en formato legible y su clase CSS
  const getStatusInfo = (project: any) => {
    // Prioridad de estados: 1. estado (valor manual), 2. estadoCalculado (automático), 3. fallback
    // Si ambos están presentes, preferimos mostrar el estado manual, excepto en casos especiales
    const estadoManual = project.estado;
    const estadoCalculado = project.estadoCalculado;
    
    // Lógica de selección de estado a mostrar basada en prioridades
    let estado = 'Por Iniciar'; // Estado por defecto si no hay nada más
    
    if (estadoManual && estadoCalculado === 'Certificado') {
      // Caso especial: Si está certificado, siempre mostramos "Certificado"
      estado = 'Certificado';
    } else if (estadoManual) {
      // Si hay estado manual, lo usamos
      estado = estadoManual;
    } else if (estadoCalculado) {
      // Si no hay manual pero sí calculado, usamos el calculado
      estado = estadoCalculado;
    }
    
    // Convertir a minúsculas para comparaciones no sensibles a mayúsculas
    const estadoLower = estado.toLowerCase();
    
    let statusClass = 'bg-gray-100 text-gray-800'; // Estilo por defecto - gris

    // Clasificación mejorada de estados para un mapeo de colores consistente
    if (estadoLower.includes('certificado') || estadoLower === 'completado' || 
        estadoLower === 'terminado' || estadoLower === 'finalizado') {
      // Verde para estados completados/certificados
      statusClass = 'bg-green-100 text-green-800'; 
    } else if (estadoLower === 'retrasado') {
      // Rojo para estados retrasados
      statusClass = 'bg-red-100 text-red-800'; 
    } else if (estadoLower.includes('progreso') || estadoLower === 'en proceso' || 
               estadoLower === 'en progreso' || estadoLower === 'pruebas' || 
               estadoLower === 'actualizacion') {
      // Azul para estados en progreso
      statusClass = 'bg-blue-100 text-blue-800'; 
    } else if (estadoLower.includes('iniciar') || estadoLower === 'por iniciar' || 
               estadoLower === 'pendiente') {
      // Amarillo para estados pendientes
      statusClass = 'bg-yellow-100 text-yellow-800';
    }
    
    // Normalizar la visualización del estado con primera letra mayúscula
    // y arreglar casos comunes para consistencia visual
    let displayEstado = '';
    
    switch (estadoLower) {
      case 'en progreso':
      case 'en proceso':
        displayEstado = 'En Progreso';
        break;
      case 'por iniciar':
      case 'pendiente':
        displayEstado = 'Por Iniciar';
        break;
      case 'certificado':
      case 'completado':
      case 'terminado':
      case 'finalizado':
        displayEstado = 'Certificado';
        break;
      case 'retrasado':
        displayEstado = 'Retrasado';
        break;
      case 'pruebas':
        displayEstado = 'En Pruebas';
        break;
      case 'actualizacion':
        displayEstado = 'Actualización';
        break;
      default:
        // Para cualquier otro estado, simplemente aplicamos mayúscula inicial
        displayEstado = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
    
    return { text: displayEstado, className: statusClass };
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
          <DialogTitle>Proyectos del Equipo: {team.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between pb-4">
            <Input
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-active" 
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <label 
                htmlFor="show-active" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Solo proyectos activos ({teamProjects.filter(p => 
                  p.estadoCalculado === 'En Progreso' || 
                  p.estadoCalculado === 'Por Iniciar' || 
                  p.estado === 'en progreso' || 
                  (p.estado && p.estado.toLowerCase().includes('iniciar'))
                ).length})
              </label>
            </div>
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
                      <TableRow key={`${project.id ?? project.idJira}-${index}`}>                        <TableCell>
                          <a 
                            href={getJiraUrl(project.idJira) ?? '#'} 
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
                        <TableCell>{project.celula}</TableCell>                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                              {status.text}
                            </span>
                            {project.fechaCertificacion && status.text === 'Certificado' && (
                              <span className="text-xs text-gray-500" title={`Certificado el ${formatDate(project.fechaCertificacion)}`}>
                                ✓
                              </span>
                            )}
                            {project.diasRetraso > 0 && (
                              <span className="text-xs text-red-500" title={`${project.diasRetraso} días de retraso`}>
                                ({project.diasRetraso}d)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(project.fechaEntrega)}</TableCell>
                        <TableCell>{project.analistaProducto ?? '-'}</TableCell>
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
