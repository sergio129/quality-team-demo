"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { useEffect, useState } from 'react';
import { getJiraUrl } from '@/utils/jiraUtils';

interface TimelineViewProps {
    projects: Project[];
    analysts: QAAnalyst[];
    filterEquipo?: string;
    filterAnalista?: string;
}

export function TimelineView({ projects, analysts, filterEquipo, filterAnalista }: TimelineViewProps) {
    const [dates, setDates] = useState<Date[]>([]);
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [selectedFilter, setSelectedFilter] = useState<'week' | 'month' | 'year' | 'custom'>('month');
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

    // Efecto para actualizar las fechas cuando cambia el filtro
    useEffect(() => {
        const today = new Date();
        let start: Date;
        
        switch (selectedFilter) {
            case 'week':
                // Inicio de la semana actual (lunes)
                start = new Date(today);
                start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                start.setHours(0, 0, 0, 0);
                break;
            
            case 'year':
                // Inicio del año actual
                start = new Date(today.getFullYear(), 0, 1);
                break;
            
            case 'month':
            case 'custom':
            default:
                // Inicio del mes actual o el mes seleccionado
                start = new Date(startDate);
                break;
        }
        
        setStartDate(start);
    }, [selectedFilter]);

    // Efecto para actualizar el calendario
    useEffect(() => {
        const newDates: Date[] = [];
        const currentDate = new Date(startDate);
        let endDate: Date;

        switch (selectedFilter) {
            case 'week':
                // 7 días desde el inicio de la semana
                endDate = new Date(currentDate);
                endDate.setDate(currentDate.getDate() + 6);
                break;
            
            case 'year':
                // Hasta fin del año
                endDate = new Date(currentDate.getFullYear(), 11, 31);
                break;
            
            case 'month':
            case 'custom':
            default:
                // Hasta fin del mes
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                break;
        }
        
        while (currentDate <= endDate) {
            newDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setDates(newDates);
    }, [startDate, selectedFilter]);

    // Resto de funciones auxiliares
    const filteredAnalysts = analysts.filter(analyst => {
        if (filterAnalista && analyst.name !== filterAnalista) return false;
        return true;
    });

    const getProjectsForAnalyst = (analystName: string) => {
        return projects.filter(p => {
            const matchesAnalista = p.analistaProducto === analystName;
            const matchesEquipo = !filterEquipo || p.equipo === filterEquipo;
            const fechaEntrega = new Date(p.fechaEntrega);
            return matchesAnalista && matchesEquipo;
        });
    };

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

    const formatDayHeader = (date: Date) => {
        const day = date.getDate();
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        return { day, dayName };
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isProjectActive = (project: Project, date: Date) => {
        // Convertir las fechas a UTC
        const projectStartDate = new Date(project.fechaEntrega);
        const projectEndDate = project.fechaCertificacion 
            ? new Date(project.fechaCertificacion) 
            : new Date(project.fechaEntrega);

        // Normalizar todas las fechas a UTC
        const compareDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ));

        const startDateUTC = new Date(Date.UTC(
            projectStartDate.getUTCFullYear(),
            projectStartDate.getUTCMonth(),
            projectStartDate.getUTCDate()
        ));

        const endDateUTC = new Date(Date.UTC(
            projectEndDate.getUTCFullYear(),
            projectEndDate.getUTCMonth(),
            projectEndDate.getUTCDate()
        ));

        return compareDate >= startDateUTC && compareDate <= endDateUTC;
    };    // Esta función ahora retorna un objeto de estilo en lugar de clases CSS
    const getProjectStyle = (project: Project) => {
        const today = new Date();
        
        // Buscar al analista asignado para usar su color como base
        const assignedAnalyst = filteredAnalysts.find(a => a.name === project.analistaProducto);
        const analystColor = assignedAnalyst?.color || '#3B82F6'; // Azul como color por defecto
        
        // Estilos por defecto
        const style: React.CSSProperties = {
            backgroundColor: `${analystColor}30`,
            borderWidth: '2px',
            borderColor: analystColor
        };
        
        if (project.fechaCertificacion) {
            // Proyecto certificado/finalizado
            const isDelayed = project.diasRetraso > 0;
            if (isDelayed) {
                return {
                    backgroundColor: '#FEE2E2', // bg-red-200
                    borderColor: '#F87171', // red-400
                    borderWidth: '2px'
                };
            }
            return {
                ...style,
                opacity: 0.7
            };
        }
        
        // Proyecto no certificado aún
        const fechaEntrega = new Date(project.fechaEntrega);
        if (fechaEntrega < today) {
            // Ha pasado la fecha de entrega y no está certificado
            return {
                backgroundColor: '#FFEDD5', // bg-orange-200
                borderColor: '#FB923C', // orange-400
                borderWidth: '2px'
            };
        }

        // Proyecto en curso dentro del plazo usando el color del analista
        return style;
    };
    
    // Para mantener la compatibilidad con el código existente que espera una clase CSS
    const getProjectColor = () => {
        return ''; // Ya no necesitamos clases, usamos estilos en línea
    };

    const renderProjectTooltip = (project: Project) => {
        const today = new Date();
        const fechaEntrega = new Date(project.fechaEntrega);
        let estado = '';

        if (project.fechaCertificacion) {
            if (project.diasRetraso > 0) {
                estado = '⚠️ Finalizado con retraso';
            } else {
                estado = '✅ Finalizado a tiempo';
            }
        } else if (fechaEntrega < today) {
            estado = '⚠️ Fecha de entrega vencida';
        } else {
            estado = '🔵 En progreso';
        }

        return `
${project.proyecto}
ID: ${project.idJira}
Estado: ${estado}
Fecha Entrega: ${formatDate(project.fechaEntrega)}
${project.fechaCertificacion ? `Fecha Certificación: ${formatDate(project.fechaCertificacion)}` : ''}
${project.diasRetraso > 0 ? `Días de Retraso: ${project.diasRetraso}` : ''}
`.trim();
    };

    // Generar array de años para el selector (5 años atrás y adelante)
    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1));

    return (
        <div className="overflow-x-auto">
            <div className="min-w-max">
                {/* Controles de filtro */}
                <div className="mb-4 flex items-center gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedFilter('week')}
                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                selectedFilter === 'week' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            Semana actual
                        </button>
                        <button
                            onClick={() => setSelectedFilter('month')}
                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                selectedFilter === 'month' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            Mes actual
                        </button>
                        <button
                            onClick={() => setSelectedFilter('year')}
                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                selectedFilter === 'year' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            Año actual
                        </button>
                    </div>

                    {/* Selectores de año/mes para vista personalizada */}
                    <div className="flex items-center gap-2">
                        <select
                            value={startDate.getFullYear()}
                            onChange={(e) => {
                                const newDate = new Date(startDate);
                                newDate.setFullYear(parseInt(e.target.value));
                                setSelectedFilter('custom');
                                setStartDate(newDate);
                            }}
                            className="px-3 py-1.5 border rounded text-sm"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select
                            value={startDate.getMonth()}
                            onChange={(e) => {
                                const newDate = new Date(startDate);
                                newDate.setMonth(parseInt(e.target.value));
                                setSelectedFilter('custom');
                                setStartDate(newDate);
                            }}
                            className="px-3 py-1.5 border rounded text-sm"
                        >
                            {months.map((date, index) => (
                                <option key={index} value={index}>
                                    {date.toLocaleDateString('es-ES', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Header con fechas */}
                <div className="flex border-b">
                    <div className="w-40 flex-shrink-0 p-2 font-semibold bg-gray-100 border-r">
                        Analista
                    </div>
                    <div className="flex">
                        {dates.map((date) => {
                            const { day, dayName } = formatDayHeader(date);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`w-12 flex-shrink-0 p-1 text-center border-r
                                        ${isWeekend ? 'bg-gray-50' : 'bg-white'}
                                        ${isToday(date) ? 'border-b-2 border-blue-500' : ''}`}
                                    title={date.toLocaleDateString('es-ES', { 
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                >
                                    <div className="text-xs text-gray-500">{dayName}</div>
                                    <div className={`text-sm ${isToday(date) ? 'font-bold text-blue-600' : ''}`}>{day}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filas de analistas */}
                <div>
                    {filteredAnalysts.map(analyst => {
                        const analystProjects = getProjectsForAnalyst(analyst.name);

                        return (                            <div key={analyst.id} className="flex border-b hover:bg-gray-50">
                                <div 
                                    className="w-40 flex-shrink-0 p-2 border-r" 
                                    style={{ 
                                        backgroundColor: analyst.color ? `${analyst.color}20` : undefined,
                                        borderLeft: analyst.color ? `4px solid ${analyst.color}` : undefined 
                                    }}
                                >
                                    {analyst.name}
                                </div>
                                <div className="flex relative min-h-[50px]">
                                    {dates.map((date) => (
                                        <div
                                            key={date.toISOString()}
                                            className={`w-12 flex-shrink-0 border-r relative
                                                ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''}
                                                ${isToday(date) ? 'bg-blue-50' : ''}`}
                                        >                                            {analystProjects.map(project => {
                                                if (!isProjectActive(project, date)) return null;
                                                const jiraUrl = getJiraUrl(project.idJira);
                                                return (
                                                    <div key={project.idJira}>
                                                        {jiraUrl ? (
                                                            <a
                                                                href={jiraUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"                                                                title={renderProjectTooltip(project)}
                                                                className="mx-1 text-xs p-1 rounded shadow-sm transition-colors cursor-pointer block"
                                                                style={getProjectStyle(project)}
                                                            >
                                                                {project.idJira}
                                                            </a>
                                                        ) : (
                                                            <span
                                                                title={renderProjectTooltip(project)}
                                                                className="mx-1 text-xs p-1 rounded shadow-sm block"
                                                                style={getProjectStyle(project)}
                                                            >
                                                                {project.idJira}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Controles de navegación */}
                <div className="mt-4 flex justify-between items-center">
                    <button
                        onClick={() => {
                            const newDate = new Date(startDate);
                            if (selectedFilter === 'week') {
                                newDate.setDate(newDate.getDate() - 7);
                            } else if (selectedFilter === 'year') {
                                newDate.setFullYear(newDate.getFullYear() - 1);
                            } else {
                                newDate.setMonth(newDate.getMonth() - 1);
                            }
                            setStartDate(newDate);
                        }}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        {selectedFilter === 'week' ? 'Semana anterior' : 
                         selectedFilter === 'year' ? 'Año anterior' : 
                         'Mes anterior'}
                    </button>
                    <span className="font-semibold">
                        {selectedFilter === 'week' 
                            ? `Semana del ${formatDate(startDate)}` 
                            : selectedFilter === 'year'
                            ? startDate.getFullYear()
                            : startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => {
                            const newDate = new Date(startDate);
                            if (selectedFilter === 'week') {
                                newDate.setDate(newDate.getDate() + 7);
                            } else if (selectedFilter === 'year') {
                                newDate.setFullYear(newDate.getFullYear() + 1);
                            } else {
                                newDate.setMonth(newDate.getMonth() + 1);
                            }
                            setStartDate(newDate);
                        }}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        {selectedFilter === 'week' ? 'Semana siguiente' : 
                         selectedFilter === 'year' ? 'Año siguiente' : 
                         'Mes siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
}
