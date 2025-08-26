"use client";

import { Project } from '@/models/Project';
import { useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { getJiraUrl } from '@/utils/jiraUtils';

interface WeeklyCertificationWidgetProps {
    projects: Project[];
}

export function WeeklyCertificationWidget({ projects }: WeeklyCertificationWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Obtener la semana actual (lunes a domingo)
    const currentWeek = useMemo(() => {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return { monday, sunday };
    }, []);

    // Función auxiliar para procesar fechas sin problemas de timezone
    const getDateWithoutTimezone = (dateString: string | Date) => {
        const dateStr = dateString.toString().includes('T') 
            ? dateString.toString().split('T')[0] 
            : dateString.toString();
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Función helper para determinar si un proyecto está certificado
    const isProjectCertified = (project: Project) => {
        return project.estado === 'certificado' || project.estadoCalculado === 'Certificado';
    };

    // Filtrar proyectos con certificación en la semana actual
    const weeklyProjects = useMemo(() => {
        return projects
            .filter(project => {
                if (!project.fechaCertificacion) return false;
                
                const certDate = getDateWithoutTimezone(project.fechaCertificacion);
                return certDate >= currentWeek.monday && certDate <= currentWeek.sunday;
            })
            .sort((a, b) => {
                // Primero ordenar por estado (pendientes primero, certificados después)
                const aIsCertified = isProjectCertified(a);
                const bIsCertified = isProjectCertified(b);
                
                if (aIsCertified !== bIsCertified) {
                    return aIsCertified ? 1 : -1; // Certificados al final
                }
                
                // Luego ordenar por fecha
                const dateA = getDateWithoutTimezone(a.fechaCertificacion!);
                const dateB = getDateWithoutTimezone(b.fechaCertificacion!);
                return dateA.getTime() - dateB.getTime();
            });
    }, [projects, currentWeek]);

    // Agrupar proyectos por día
    const projectsByDay = useMemo(() => {
        const grouped: { [key: string]: Project[] } = {};
        
        weeklyProjects.forEach(project => {
            const certDateStr = project.fechaCertificacion!.toString().includes('T') 
                ? project.fechaCertificacion!.toString().split('T')[0] 
                : project.fechaCertificacion!.toString();
            
            if (!grouped[certDateStr]) {
                grouped[certDateStr] = [];
            }
            grouped[certDateStr].push(project);
        });
        
        return grouped;
    }, [weeklyProjects]);

    // Formatear fecha para mostrar
    const formatDate = (dateStr: string) => {
        // Usar la fecha directamente sin crear objeto Date para evitar problemas de timezone
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Verificar si una fecha es hoy
    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    // Verificar si una fecha ya pasó
    const isPast = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr < today;
    };

    const renderJiraLink = (project: Project) => {
        const jiraUrl = getJiraUrl(project.idJira);
        
        if (jiraUrl) {
            return (
                <a
                    href={jiraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
                    title={`Abrir ${project.idJira} en Jira`}
                >
                    {project.idJira}
                </a>
            );
        }
        
        return (
            <span className="font-mono text-sm text-gray-700">
                {project.idJira}
            </span>
        );
    };

    if (weeklyProjects.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Certificaciones de esta semana
                        </h3>
                    </div>
                </div>
                <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay certificaciones programadas para esta semana</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div 
                className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Certificaciones de esta semana
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {weeklyProjects.length}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                        {currentWeek.monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {currentWeek.sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-4">
                    <div className="space-y-4">
                        {Object.entries(projectsByDay)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([dateStr, dayProjects]) => (
                                <div 
                                    key={dateStr} 
                                    className={`border rounded-lg p-3 ${
                                        isToday(dateStr) 
                                            ? 'border-blue-200 bg-blue-50' 
                                            : isPast(dateStr)
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    {/* Day header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            {isToday(dateStr) ? (
                                                <Clock className="w-4 h-4 text-blue-600" />
                                            ) : isPast(dateStr) ? (
                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <Calendar className="w-4 h-4 text-gray-600" />
                                            )}
                                            <span className={`font-medium ${
                                                isToday(dateStr) 
                                                    ? 'text-blue-900' 
                                                    : isPast(dateStr)
                                                    ? 'text-red-900'
                                                    : 'text-gray-900'
                                            }`}>
                                                {formatDate(dateStr)}
                                                {isToday(dateStr) && ' (Hoy)'}
                                                {isPast(dateStr) && ' (Vencido)'}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            isToday(dateStr)
                                                ? 'bg-blue-100 text-blue-800'
                                                : isPast(dateStr)
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {dayProjects.length} proyecto{dayProjects.length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Projects list */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {dayProjects.map(project => (
                                            <div 
                                                key={project.idJira}
                                                className={`p-3 rounded-md border transition-all duration-200 hover:shadow-sm ${
                                                    isProjectCertified(project)
                                                        ? 'bg-green-50 border-green-200 hover:border-green-300'
                                                        : isToday(dateStr)
                                                        ? 'bg-white border-blue-200 hover:border-blue-300'
                                                        : isPast(dateStr)
                                                        ? 'bg-white border-red-200 hover:border-red-300'
                                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            {isProjectCertified(project) && (
                                                                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                                                    CERTIFICADO
                                                                </span>
                                                            )}
                                                            {renderJiraLink(project)}
                                                            {project.diasRetraso > 0 && (
                                                                <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded">
                                                                    +{project.diasRetraso}d
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm truncate ${
                                                            isProjectCertified(project) 
                                                                ? 'text-green-700' 
                                                                : 'text-gray-600'
                                                        }`} title={project.proyecto}>
                                                            {project.proyecto}
                                                        </p>
                                                        <div className={`flex items-center justify-between mt-2 text-xs ${
                                                            isProjectCertified(project) 
                                                                ? 'text-green-600' 
                                                                : 'text-gray-500'
                                                        }`}>
                                                            <span>{project.equipo}</span>
                                                            <span>{project.analistaProducto}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Summary footer */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                                Total: <strong>{weeklyProjects.length}</strong> certificaciones esta semana
                            </span>
                            <div className="flex items-center space-x-4">
                                {Object.keys(projectsByDay).some(date => isToday(date)) && (
                                    <span className="text-blue-600">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {projectsByDay[new Date().toISOString().split('T')[0]]?.length || 0} hoy
                                    </span>
                                )}
                                {Object.keys(projectsByDay).some(date => isPast(date)) && (
                                    <span className="text-red-600">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        {Object.entries(projectsByDay)
                                            .filter(([date]) => isPast(date))
                                            .reduce((sum, [, projects]) => sum + projects.length, 0)} vencidos
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
