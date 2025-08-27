"use client";

import { Project } from '@/models/Project';
import { useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
// Si tienes un componente Tooltip real, reemplaza el siguiente por el import real
const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => (
    <span title={text} style={{ cursor: 'help' }}>{children}</span>
);
import { getJiraUrl } from '@/utils/jiraUtils';

interface WeeklyCertificationWidgetProps {
    projects: Project[];
}

export function WeeklyCertificationWidget({ projects }: WeeklyCertificationWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'certified' | 'pending'>('all');
    const [isCompactView, setIsCompactView] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0); // Para navegación por semanas
    const [searchTerm, setSearchTerm] = useState(''); // Para búsqueda
    
    // Obtener la semana actual (lunes a domingo) con navegación
    const currentWeek = useMemo(() => {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + (weekOffset * 7));
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return { monday, sunday };
    }, [weekOffset]);

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

    // Filtrar proyectos según el estado y búsqueda
    const filteredProjects = useMemo(() => {
        return weeklyProjects.filter(project => {
            // Filtro por estado
            const matchesStatus = 
                filterStatus === 'all' || 
                (filterStatus === 'certified' && isProjectCertified(project)) ||
                (filterStatus === 'pending' && !isProjectCertified(project));
            
            // Filtro por búsqueda
            const matchesSearch = !searchTerm || 
                project.idJira?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.proyecto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.analistaProducto?.toLowerCase().includes(searchTerm.toLowerCase());
                
            return matchesStatus && matchesSearch;
        });
    }, [weeklyProjects, filterStatus, searchTerm]);

    // Calcular estadísticas de progreso
    const progressStats = useMemo(() => {
        const total = weeklyProjects.length;
        const certified = weeklyProjects.filter(isProjectCertified).length;
        const pending = total - certified;
        const percentage = total > 0 ? Math.round((certified / total) * 100) : 0;
        
        return { total, certified, pending, percentage };
    }, [weeklyProjects]);

    // Funciones de navegación por semanas
    const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setWeekOffset(0);

    // Función para marcar proyecto como certificado
    const markAsCertified = async (project: Project) => {
        try {
            const response = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idJira: project.idJira,
                    project: {
                        ...project,
                        estado: 'certificado',
                        estadoCalculado: 'Certificado',
                        fechaCertificacion: new Date().toISOString().split('T')[0]
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el proyecto');
            }
            
            // Recargar la página o manejar la actualización del estado
            window.location.reload();
        } catch (error) {
            console.error('Error al marcar como certificado:', error);
            alert('Error al actualizar el proyecto. Por favor, inténtalo de nuevo.');
        }
    };

    // Agrupar proyectos por día (usando proyectos filtrados)
    const projectsByDay = useMemo(() => {
        const grouped: { [key: string]: Project[] } = {};
        
        filteredProjects.forEach(project => {
            const certDateStr = project.fechaCertificacion!.toString().includes('T') 
                ? project.fechaCertificacion!.toString().split('T')[0] 
                : project.fechaCertificacion!.toString();
            
            if (!grouped[certDateStr]) {
                grouped[certDateStr] = [];
            }
            grouped[certDateStr].push(project);
        });
        
        return grouped;
    }, [filteredProjects]);

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
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl border border-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl p-1 md:p-2 text-xs sm:text-sm">
            {/* Sticky Header y Progreso */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 rounded-t-2xl shadow-sm px-1 sm:px-4 py-1 sm:py-2">
                <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-7 h-7 text-green-600" />
                        <h3 className="text-xl font-bold text-gray-900">
                            Certificaciones de esta semana
                        </h3>
                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                            {weeklyProjects.length}
                        </span>
                        {weekOffset !== 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToCurrentWeek();
                                }}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                                Actual
                            </button>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Navegación por semanas */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPreviousWeek();
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Semana anterior"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-base text-gray-700 min-w-[120px] text-center">
                            {currentWeek.monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {currentWeek.sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            {weekOffset === 0 && <span className="text-blue-600 font-semibold"> (Actual)</span>}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNextWeek();
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Semana siguiente"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                {/* Barra de progreso sticky con tooltip */}
                {weeklyProjects.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 group relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                                Progreso: {progressStats.certified} de {progressStats.total} certificados
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                                {progressStats.percentage}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 relative">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300 group-hover:brightness-110 animate-glow-bar"
                                style={{ width: `${progressStats.percentage}%` }}
                            ></div>
                            {/* Tooltip */}
                            <div className="absolute left-1/2 -top-8 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-30">
                                {progressStats.certified} certificados / {progressStats.pending} pendientes ({progressStats.percentage}%)
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-4 animate-fade-in-up">
                    {/* Campo de búsqueda */}
                    <div className="mb-4">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar proyectos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Controles de filtros y vista */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        {/* Filtros por estado */}
                        <div className="flex items-center space-x-1">
                            <span className="text-sm text-gray-600 mr-2">Filtrar:</span>
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                    filterStatus === 'all' 
                                        ? 'bg-blue-100 text-blue-800 font-medium' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Todos ({weeklyProjects.length})
                            </button>
                            <button
                                onClick={() => setFilterStatus('certified')}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                    filterStatus === 'certified' 
                                        ? 'bg-green-100 text-green-800 font-medium' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Certificados ({progressStats.certified})
                            </button>
                            <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                    filterStatus === 'pending' 
                                        ? 'bg-orange-100 text-orange-800 font-medium' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Pendientes ({progressStats.pending})
                            </button>
                        </div>

                        {/* Toggle vista compacta */}
                        <button
                            onClick={() => setIsCompactView(!isCompactView)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d={isCompactView ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 10h16M4 14h16M4 18h16"} 
                                />
                            </svg>
                            <span>{isCompactView ? 'Vista detallada' : 'Vista compacta'}</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isCompactView ? (
                            /* Vista Compacta */
                            <div className="space-y-2">
                                {filteredProjects.map((project, index) => (
                                    <div 
                                        key={project.idJira}
                                        className={`flex items-center justify-between p-2 rounded border transition-all duration-200 hover:bg-gray-50 hover:shadow-sm animate-fade-in-up ${
                                            isProjectCertified(project)
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200'
                                        }`}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            {isProjectCertified(project) ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                            )}
                                            {renderJiraLink(project)}
                                            <span className="truncate text-sm text-gray-900" title={project.proyecto}>
                                                {project.proyecto}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            <span className="text-xs text-gray-500">
                                                {formatDate(project.fechaCertificacion!.toString().includes('T') 
                                                    ? project.fechaCertificacion!.toString().split('T')[0] 
                                                    : project.fechaCertificacion!.toString())}
                                            </span>
                                            {isProjectCertified(project) ? (
                                                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                                    ✓
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => markAsCertified(project)}
                                                    className="bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105 text-xs px-2 py-1 rounded font-medium transition-all duration-200"
                                                    title="Marcar como certificado"
                                                >
                                                    Certificar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Vista Detallada */
                            Object.entries(projectsByDay)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([dateStr, dayProjects], dayIndex) => {
                                    const allCertified = dayProjects.every(isProjectCertified);
                                    const anyPending = dayProjects.some(p => !isProjectCertified(p));
                                    const isPastDay = isPast(dateStr);
                                    const isTodayDay = isToday(dateStr);
                                    // Lógica de color y estado
                                    let borderColor = 'border-gray-200';
                                    let bgColor = 'bg-gray-50';
                                    let icon = <Calendar className="w-10 h-10 text-gray-400" />;
                                    let textColor = 'text-gray-900';
                                    let badgeColor = 'bg-gray-100 text-gray-800';
                                    let statusText = '';
                                    let gradient = '';
                                    let glow = '';
                                    if (isTodayDay) {
                                        borderColor = 'border-blue-300';
                                        bgColor = 'bg-blue-50';
                                        icon = <Clock className="w-10 h-10 text-blue-500" />;
                                        textColor = 'text-blue-900';
                                        badgeColor = 'bg-blue-100 text-blue-800';
                                        statusText = ' (Hoy)';
                                        glow = 'ring-4 ring-blue-300/40 animate-glow-today';
                                    } else if (isPastDay && allCertified) {
                                        borderColor = 'border-green-300';
                                        bgColor = 'bg-green-50';
                                        icon = <CheckCircle className="w-10 h-10 text-green-500" />;
                                        textColor = 'text-green-900';
                                        badgeColor = 'bg-green-100 text-green-800';
                                        statusText = ' (Completado)';
                                        gradient = 'bg-gradient-to-br from-green-50 via-green-100 to-green-50';
                                    } else if (isPastDay && anyPending) {
                                        borderColor = 'border-red-300';
                                        bgColor = 'bg-red-50';
                                        icon = <AlertTriangle className="w-10 h-10 text-red-500" />;
                                        textColor = 'text-red-900';
                                        badgeColor = 'bg-red-100 text-red-800';
                                        statusText = ' (Vencido)';
                                        gradient = 'bg-gradient-to-br from-red-50 via-red-100 to-red-50';
                                    }
                                    // Resumen diario
                                    const certifiedCount = dayProjects.filter(isProjectCertified).length;
                                    const pendingCount = dayProjects.length - certifiedCount;
                                    return (
                                        <div key={dateStr} className="relative">
                                            {/* Separador visual entre días */}
                                            {dayIndex > 0 && (
                                                <div className="absolute -top-4 left-0 w-full flex items-center justify-center z-0">
                                                    <div className="h-2 w-2 rounded-full bg-gray-300 opacity-60 animate-pulse" />
                                                </div>
                                            )}
                                            <div
                                                className={`border rounded-xl p-2 sm:p-3 mb-4 sm:mb-6 transition-all duration-300 hover:shadow-xl animate-fade-in-up ${borderColor} ${bgColor} ${gradient} ${glow} shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-1 sm:gap-6`}
                                                style={{ animationDelay: `${dayIndex * 0.1}s`, background: isTodayDay ? 'linear-gradient(90deg, #e0f2fe 0%, #f0fdfa 100%)' : undefined }}
                                            >
                                                {/* Day header */}
                                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                                    {icon}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`font-bold text-base md:text-xl truncate ${textColor}`}>
                                                            {formatDate(dateStr)}{statusText}
                                                        </span>
                                                        <Tooltip text={`Proyectos este día: ${dayProjects.length}`}>
                                                            <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${badgeColor} w-fit mt-1`}>
                                                                {dayProjects.length} proyecto{dayProjects.length > 1 ? 's' : ''}
                                                            </span>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                {/* Resumen diario y botón */}
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                    <Tooltip text={`Certificados: ${certifiedCount} / ${dayProjects.length}\nPendientes: ${pendingCount}`}>
                                                        <span className="text-xs md:text-sm text-gray-500">
                                                            <span className="font-semibold text-green-700">{certifiedCount}</span> / {dayProjects.length} certificados
                                                            {pendingCount > 0 && <span className="ml-2 font-semibold text-orange-600">{pendingCount} pendientes</span>}
                                                        </span>
                                                    </Tooltip>
                                                    {/* Botón Certificar Todo (solo si hay pendientes) */}
                                                    {pendingCount > 0 && (
                                                        <button
                                                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm font-semibold px-3 py-1 rounded shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                            // onClick={() => handleCertifyAll(dateStr)}
                                                            title="Certificar todos los proyectos de este día"
                                                            disabled
                                                        >
                                                            Certificar Todo
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Projects list */}
                                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2 mt-2">
                                                {dayProjects.map((project, projectIndex) => (
                                                    <div 
                                                        key={project.idJira}
                                                        className={`p-3 rounded-md border transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 animate-fade-in-scale ${
                                                            isProjectCertified(project)
                                                                ? 'bg-green-50 border-green-200 hover:border-green-300'
                                                                : isToday(dateStr)
                                                                ? 'bg-white border-blue-200 hover:border-blue-300'
                                                                : isPast(dateStr)
                                                                ? 'bg-white border-red-200 hover:border-red-300'
                                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                                        }`}
                                                        style={{ animationDelay: `${projectIndex * 0.05}s` }}
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
                                                                    <div className="flex items-center space-x-2">
                                                                        <span>{project.analistaProducto}</span>
                                                                        {!isProjectCertified(project) && (
                                                                            <button
                                                                                onClick={() => markAsCertified(project)}
                                                                                className="bg-green-500 text-white hover:bg-green-600 hover:scale-105 text-xs px-2 py-1 rounded font-medium transition-all duration-200"
                                                                                title="Marcar como certificado"
                                                                            >
                                                                                ✓ Certificar
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>

                    {/* Summary footer */}
                    <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200 sticky bottom-0 z-30 bg-white/80 backdrop-blur rounded-b-2xl shadow-md px-1 sm:px-4">
            {/* ...existing code... */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <Tooltip text={
                                filterStatus === 'all'
                                    ? `Total de certificaciones esta semana: ${weeklyProjects.length}`
                                    : `Mostrando: ${filteredProjects.length} de ${weeklyProjects.length} proyectos`
                            }>
                                <span>
                                    {filterStatus === 'all' ? (
                                        <>Total: <strong>{weeklyProjects.length}</strong> certificaciones esta semana</>
                                    ) : (
                                        <>Mostrando: <strong>{filteredProjects.length}</strong> de {weeklyProjects.length} proyectos</>
                                    )}
                                </span>
                            </Tooltip>
                            <div className="flex items-center space-x-4">
                                {progressStats.certified > 0 && (
                                    <Tooltip text={`Total certificados esta semana: ${progressStats.certified}`}>
                                        <span className="text-green-600">
                                            <CheckCircle className="w-4 h-4 inline mr-1" />
                                            {progressStats.certified} certificados
                                        </span>
                                    </Tooltip>
                                )}
                                {progressStats.pending > 0 && (
                                    <Tooltip text={`Total pendientes esta semana: ${progressStats.pending}`}>
                                        <span className="text-orange-600">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            {progressStats.pending} pendientes
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Compactación móvil extrema y animaciones CSS para glow */}
            <style jsx>{`
                @media (max-width: 480px) {
                    .xs\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .rounded-xl { border-radius: 0.75rem; }
                    .p-2 { padding: 0.5rem !important; }
                    .mb-4 { margin-bottom: 0.75rem !important; }
                    .gap-1 { gap: 0.25rem !important; }
                    .text-xs { font-size: 0.75rem !important; }
                    .px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
                }
                @keyframes glow-bar {
                    0%, 100% { box-shadow: 0 0 0px 0 #60a5fa; }
                    50% { box-shadow: 0 0 16px 4px #60a5fa88; }
                }
                .animate-glow-bar { animation: glow-bar 2s infinite alternate; }
                @keyframes glow-today {
                    0%, 100% { box-shadow: 0 0 0px 0 #3b82f6; }
                    50% { box-shadow: 0 0 16px 4px #3b82f688; }
                }
                .animate-glow-today { animation: glow-today 2s infinite alternate; }
            `}</style>
        </div>
    );
}
