'use client';

import { Project } from '@/models/Project';
import { getJiraUrl } from '@/utils/jiraUtils';
import { Calendar, Clock, Users, User, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ProjectCardsViewProps {
  readonly projects: Project[];
  readonly onEditProject: (project: Project) => void;
  readonly onDeleteProject: (project: Project) => void;
  readonly onChangeStatus: (project: Project) => void;
}

export default function ProjectCardsView({
  projects,
  onEditProject,
  onDeleteProject,
  onChangeStatus
}: ProjectCardsViewProps) {
  // Función helper para formatear fechas
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    });
  };

  // Función para obtener el color del estado
  const getStatusColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en progreso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el ícono del estado
  const getStatusIcon = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
        return <CheckCircle className="w-4 h-4" />;
      case 'en progreso':
        return <Clock className="w-4 h-4" />;
      case 'pendiente':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Función para renderizar el ID de Jira
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

  // Función para calcular si el proyecto está retrasado
  const isProjectDelayed = (project: Project) => {
    if (!project.fechaEntrega) return false;
    const today = new Date();
    const fechaEntrega = new Date(project.fechaEntrega);
    return fechaEntrega < today && project.estado?.toLowerCase() !== 'completado';
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No se encontraron proyectos</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className={`bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow duration-200 ${
            isProjectDelayed(project) ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        >
          {/* Header de la tarjeta */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate" title={project.proyecto}>
                  {project.proyecto}
                </h3>
                <div className="mt-1">
                  {renderJiraId(project.idJira)}
                </div>
              </div>              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.estado ?? '')}`}>
                {getStatusIcon(project.estado ?? '')}
                {project.estado ?? 'Sin estado'}
              </div>
            </div>
          </div>

          {/* Contenido de la tarjeta */}
          <div className="p-4 space-y-3">
            {/* Equipo y Célula */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {project.equipo} {project.celula && `- ${project.celula}`}
              </span>
            </div>

            {/* Analista */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate" title={project.analistaProducto}>
                {project.analistaProducto}
              </span>
            </div>

            {/* Fechas */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Entrega: {formatDate(project.fechaEntrega)}</span>
              </div>
              {project.fechaRealEntrega && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Real: {formatDate(project.fechaRealEntrega)}</span>
                </div>
              )}
            </div>

            {/* Horas y Días */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{project.horas || 0}h</span>
              </div>
              <div className="text-gray-600">
                {project.dias || 0} días
              </div>
            </div>

            {/* Plan de Trabajo */}
            {project.planTrabajo && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="truncate" title={project.planTrabajo}>
                  {project.planTrabajo}
                </span>
              </div>
            )}            {/* Indicador de retraso */}
            {Boolean(project.diasRetraso && project.diasRetraso > 0) && (
              <div className="bg-red-100 border border-red-200 rounded-md p-2">
                <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Retraso: {project.diasRetraso} días
                </div>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between items-center">
              <button
                onClick={() => onChangeStatus(project)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Cambiar Estado
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditProject(project)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteProject(project)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
