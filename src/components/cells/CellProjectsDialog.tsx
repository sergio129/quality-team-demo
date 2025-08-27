'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell } from '@/models/Cell';
import { Project } from '@/models/Project';
import { useProjects } from '@/hooks/useProjects';
import { getJiraUrl } from '@/utils/jiraUtils';
import { ChangeProjectStatusDialog } from '../projects/ChangeProjectStatusDialog';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Estadísticas de proyectos
  const projectStats = useMemo(() => {
    const total = cellProjects.length;
    const completados = cellProjects.filter(p => getStatusInfo(p).text === 'Certificado').length;
    const enProgreso = cellProjects.filter(p => getStatusInfo(p).text === 'En Progreso').length;
    const retrasados = cellProjects.filter(p => p.diasRetraso > 0).length;

    return { total, completados, enProgreso, retrasados };
  }, [cellProjects]);

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              Proyectos de célula: {cell.name}
            </DialogTitle>
          </DialogHeader>

          {/* Estadísticas del header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-2xl font-bold text-blue-600">{projectStats.total}</span>
                </div>
                <div className="text-sm text-gray-600">Total Proyectos</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-2xl font-bold text-green-600">{projectStats.completados}</span>
                </div>
                <div className="text-sm text-gray-600">Completados</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-2xl font-bold text-orange-600">{projectStats.enProgreso}</span>
                </div>
                <div className="text-sm text-gray-600">En Progreso</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-2xl font-bold text-red-600">{projectStats.retrasados}</span>
                </div>
                <div className="text-sm text-gray-600">Retrasados</div>
              </div>
            </div>
          </motion.div>

          {/* Resto del contenido se mantiene igual por ahora */}
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
            ) : cellProjects.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-gray-500">No hay proyectos asignados a esta célula</p>
              </div>
            ) : (
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
                    {cellProjects.map((project, index) => {
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
                          <TableCell>
                            <div className="flex items-center gap-2">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                          <TableCell>{project.analistaProducto || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>

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
