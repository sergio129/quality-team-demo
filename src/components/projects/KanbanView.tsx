'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/models/Project';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getJiraUrl } from '@/utils/jiraUtils';
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, Users, User, FileText } from 'lucide-react';
import { changeProjectStatus } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface KanbanViewProps {
  readonly projects: Project[];
  readonly onEditProject: (project: Project) => void;
  readonly onDeleteProject: (project: Project) => void;
  readonly onChangeStatus: (project: Project) => void;
  readonly startDate?: Date | null;
  readonly endDate?: Date | null;
  readonly selectedDateFilter?: 'week' | 'month' | 'custom-month' | 'custom';
}

export default function KanbanView({
  projects,
  onEditProject,
  onDeleteProject,
  onChangeStatus,
  startDate,
  endDate,
  selectedDateFilter = 'month'
}: KanbanViewProps) {
  // Estado para manejar actualizaciones locales durante el drag and drop
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  // Efecto para actualizar los proyectos locales cuando cambian los props
  useEffect(() => {
    setLocalProjects(projects);
    // Los proyectos ya vienen filtrados desde ProjectTable
  }, [projects]);  // Agrupar proyectos por estado
  const getColumnProjects = (status: string) => {
    return localProjects.filter(p => {
      if (status === 'Retrasado') {
        // Mostrar en columna "Retrasado" solo si tiene días de retraso > 0 y no está certificado
        const isDelayed = isProjectDelayed(p);
        return isDelayed;
      }
      
      // Para otras columnas, mostrar solo si:
      // 1. Coincide con el estado de la columna
      // 2. Y no está retrasado (o está certificado a pesar de estar retrasado)
      if (isProjectDelayed(p)) {
        return false; // No mostrar proyectos retrasados en otras columnas
      }
      return p.estadoCalculado === status;
    });
  };

  // Formatear la fecha en formato local
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    });
  };  // Verificar si un proyecto está retrasado
  const isProjectDelayed = (project: Project) => {
    // Un proyecto está retrasado si:
    // 1. Tiene días de retraso mayor a 0
    // 2. Y NO está certificado
    
    return project.diasRetraso > 0 && 
           project.estadoCalculado !== 'Certificado';
  };

  // Renderizar el ID de Jira como un enlace
  const renderJiraId = (idJira: string | null | undefined) => {
    if (!idJira) return '';
    
    const jiraUrl = getJiraUrl(idJira);
    if (!jiraUrl) return idJira;

    return (
      <a
        href={jiraUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
      >
        {idJira}
      </a>
    );
  };

  // Manejo del evento de finalización de drag and drop
  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    
    // Si no hay destino válido, no hacemos nada
    if (!destination) return;
    
    // Si la fuente y el destino son iguales, no hacemos nada
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Obtenemos el proyecto que se movió
    const projectId = draggableId;
    const project = localProjects.find(p => p.id === projectId || p.idJira === projectId);
    
    if (!project) {
      toast.error('No se pudo encontrar el proyecto');
      return;
    }
    
    // El nuevo estado depende de la columna de destino
    const newStatus = destination.droppableId;
    
    // Si la columna es "Retrasado", no permitimos el movimiento
    if (newStatus === 'Retrasado') {
      toast.error('No se puede mover un proyecto a la columna Retrasado');
      return;
    }
    
    try {
      // Optimistic update - actualizar la UI inmediatamente
      const updatedProjects = localProjects.map(p => {
        if (p.id === project.id || p.idJira === project.idJira) {
          return {
            ...p,
            estadoCalculado: newStatus as 'Por Iniciar' | 'En Progreso' | 'Certificado'
          };
        }
        return p;
      });
      
      setLocalProjects(updatedProjects);
      
      // Llamar a la API para actualizar el estado
      await changeProjectStatus(
        project.id || '', 
        newStatus, 
        project.idJira
      );
      
    } catch (error) {
      // Revertir los cambios locales si hay un error
      setLocalProjects(projects);
      toast.error('Error al cambiar el estado del proyecto');
    }
  };

  // Colores para las columnas
  const getColumnStyle = (columnId: string) => {
    switch (columnId) {
      case 'Por Iniciar':
        return 'border-amber-300 bg-amber-50';
      case 'En Progreso':
        return 'border-blue-300 bg-blue-50';
      case 'Certificado':
        return 'border-green-300 bg-green-50';
      case 'Retrasado':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // Lista de columnas para el Kanban
  const columns = [
    { id: 'Por Iniciar', title: 'Por Iniciar' },
    { id: 'En Progreso', title: 'En Progreso' },
    { id: 'Certificado', title: 'Certificado' },
    { id: 'Retrasado', title: 'Retrasados' },
  ];
  // Formatear periodo para mostrar en un mensaje informativo
  const getPeriodMessage = () => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    switch (selectedDateFilter) {
      case 'week':
        return 'Mostrando proyectos de la semana actual';
      case 'month':
        return 'Mostrando proyectos del mes actual';
      case 'custom-month':
        return `Mostrando proyectos de ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      case 'custom':
        return `Mostrando proyectos del ${start.toLocaleDateString('es-ES')} al ${end.toLocaleDateString('es-ES')}`;
      default:
        return '';
    }
  };  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col space-y-4">
        {/* Mensaje de período seleccionado */}
        {startDate && (
          <div className="text-sm text-gray-500 italic mb-2">
            {getPeriodMessage()}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`rounded-lg border ${getColumnStyle(column.id)} p-3`}
            >
              <h3 className="font-medium text-lg mb-3 flex items-center justify-between">
                {column.title}
                <span className="text-sm font-normal bg-white px-2 py-1 rounded-full">
                  {getColumnProjects(column.id).length}
                </span>
              </h3>
              
              <Droppable droppableId={column.id} isDropDisabled={column.id === 'Retrasado'}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[200px] rounded-md transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-gray-100 border-2 border-dashed border-gray-300' 
                        : ''
                    }`}
                  >
                    {getColumnProjects(column.id).map((project, index) => (
                      <Draggable
                        key={project.id || project.idJira}
                        draggableId={project.id || project.idJira || ''}
                        index={index}
                        // Desactivar el drag si está en "Retrasado" o si es "Certificado"
                        isDragDisabled={
                          column.id === 'Retrasado' || 
                          project.estadoCalculado === 'Certificado'
                        }
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 p-3 rounded-md bg-white border border-gray-200 shadow-sm
                              ${snapshot.isDragging ? 'shadow-md' : ''}
                              ${project.estadoCalculado === 'Certificado' ? 'cursor-default opacity-90' : 'cursor-grab'}
                            `}
                          >                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {project.nombre || project.proyecto}
                              </h4>
                              <div className="shrink-0 ml-2">
                                {renderJiraId(project.idJira)}
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1 mb-2">
                              {/* Equipo y célula */}
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>
                                  {project.equipo}
                                  {project.celula && <span> - {project.celula}</span>}
                                </span>
                              </div>
                              
                              {/* Fecha de entrega */}
                              <div className={`flex items-center gap-1 ${
                                column.id === 'Retrasado' ? 'text-red-500 font-semibold' : ''
                              }`}>
                                <Calendar className="w-3 h-3" />
                                <span>Entrega: {formatDate(project.fechaEntrega)}</span>
                                {column.id === 'Retrasado' && (
                                  <span className="bg-red-100 text-red-700 px-1 rounded text-xs">
                                    {project.diasRetraso} {project.diasRetraso === 1 ? 'día' : 'días'} de retraso
                                  </span>
                                )}
                              </div>
                              
                              {/* Horas/dias estimados */}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{project.horas}h ({project.dias} días)</span>
                              </div>

                              {/* Analista */}
                              {project.analistaProducto && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>Analista: {project.analistaProducto}</span>
                                </div>
                              )}

                              {/* Descripción (si existe) */}
                              {project.descripcion && (
                                <div className="flex items-start gap-1 mt-2">
                                  <FileText className="w-3 h-3 mt-0.5" />
                                  <span className="line-clamp-2 text-gray-600">{project.descripcion}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 flex justify-end gap-1">
                              <button
                                onClick={() => onEditProject(project)}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Editar
                              </button>
                              <span className="text-gray-400">|</span>
                              <button
                                onClick={() => onChangeStatus(project)}
                                className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                              >
                                Estado
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
