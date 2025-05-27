"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { useEffect, useState } from 'react';
import { getJiraUrl } from '@/utils/jiraUtils';
import Holidays from 'date-holidays';

// Inicializar la instancia de Holidays para Colombia
const holidays = new Holidays('CO');

// Función para verificar si una fecha es día festivo en Colombia
const isHoliday = (date: Date): boolean => {
    const holiday = holidays.isHoliday(date);
    return !!holiday;
};

interface TimelineViewProps {
    projects: Project[];
    analysts: QAAnalyst[];
    filterEquipo?: string;
    filterAnalista?: string;
    // Nuevos props para recibir los filtros de fecha del padre
    startDate: Date;
    endDate: Date | null;
    selectedDateFilter: 'week' | 'month' | 'year' | 'custom';
}

export function TimelineView({ 
    projects, 
    analysts, 
    filterEquipo, 
    filterAnalista,
    startDate,
    endDate,
    selectedDateFilter
}: Readonly<TimelineViewProps>) {
    const [dates, setDates] = useState<Date[]>([]);    // Efecto para actualizar el calendario basado en los filtros de fecha del padre
    useEffect(() => {
        const newDates: Date[] = [];
        
        // Crear una copia de la fecha de inicio para no modificar la original
        const currentDate = new Date(startDate);
        
        // Usar la fecha de fin proporcionada o calcular una fecha de fin apropiada según el filtro
        let calculatedEndDate: Date;
        
        if (endDate) {
            calculatedEndDate = new Date(endDate);
        } else {
            calculatedEndDate = new Date(currentDate);
            
            switch (selectedDateFilter) {
                case 'week':
                    // Una semana desde la fecha de inicio
                    calculatedEndDate.setDate(currentDate.getDate() + 6);
                    break;
                case 'month':
                    // Fin del mes
                    calculatedEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    break;
                case 'year':
                    // Para año, mostrar solo los primeros 31 días para no sobrecargar
                    calculatedEndDate = new Date(currentDate);
                    calculatedEndDate.setDate(currentDate.getDate() + 30);
                    break;
            }
        }
        
        // Generar el array de fechas a mostrar
        while (currentDate <= calculatedEndDate) {
            newDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setDates(newDates);
    }, [startDate, endDate, selectedDateFilter]);

    // Resto de funciones auxiliares
    const filteredAnalysts = analysts.filter(analyst => {
        if (filterAnalista && analyst.name !== filterAnalista) return false;
        return true;
    });    const getProjectsForAnalyst = (analystName: string) => {
        return projects.filter(p => {
            // Filtrado básico por analista y equipo
            const matchesAnalista = p.analistaProducto === analystName;
            const matchesEquipo = !filterEquipo || p.equipo === filterEquipo;
            
            // No aplicar filtro de fecha adicional, mostrar todos los proyectos del analista
            // El filtrado por fecha se maneja en isProjectActive para cada día específico
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
    };    const isProjectActive = (project: Project, date: Date) => {
        // No mostrar proyectos en fines de semana o días festivos
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isColombianHoliday = isHoliday(date);
        if (isWeekend || isColombianHoliday) return false;
        
        // Si no hay fechaEntrega, no podemos determinar si está activo
        if (!project.fechaEntrega) return false;
        
        // Convertir fechas a objetos Date y normalizar
        const projectFechaEntrega = new Date(project.fechaEntrega);
        projectFechaEntrega.setHours(0, 0, 0, 0);
        
        const projectFechaCertificacion = project.fechaCertificacion 
            ? new Date(project.fechaCertificacion) 
            : null;
        if (projectFechaCertificacion) {
            projectFechaCertificacion.setHours(0, 0, 0, 0);
        }
        
        // Normalizar la fecha de comparación
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        
        // Obtener la fecha actual para proyectos en curso
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Simplificar la lógica:
        
        // CASO 1: Si el proyecto tiene fecha de certificación y la fecha está entre la fecha de entrega y certificación
        if (projectFechaCertificacion) {
            return compareDate.getTime() >= projectFechaEntrega.getTime() && 
                  compareDate.getTime() <= projectFechaCertificacion.getTime();
        }
        
        // CASO 2: Si el proyecto NO tiene fecha de certificación:
        
        // Si la fecha de comparación es exactamente la fecha de entrega, siempre mostrar
        if (compareDate.getTime() === projectFechaEntrega.getTime()) {
            return true;
        }
        
        // Para fechas después de la entrega hasta hoy (proyectos en curso/retrasados)
        if (compareDate.getTime() > projectFechaEntrega.getTime() && 
            compareDate.getTime() <= today.getTime()) {
            return true;
        }
        
        // En cualquier otro caso, no mostrar
        return false;
    };// Esta función ahora retorna un objeto de estilo en lugar de clases CSS
    const getProjectStyle = (project: Project) => {
        const today = new Date();
        
        // Buscar al analista asignado para usar su color como base
        const assignedAnalyst = filteredAnalysts.find(a => a.name === project.analistaProducto);
        const analystColor = assignedAnalyst?.color ?? '#3B82F6'; // Azul como color por defecto
        
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
            <div className="min-w-max">                {/* Los controles de filtro se eliminaron para utilizar los del componente padre */}

                {/* Header con fechas */}
                <div className="flex border-b">
                    <div className="w-40 flex-shrink-0 p-2 font-semibold bg-gray-100 border-r">
                        Analista
                    </div>
                    <div className="flex">
                        {dates.map((date) => {
                            const { day, dayName } = formatDayHeader(date);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0=Domingo, 6=Sábado
                            const isColombianHoliday = isHoliday(date);
                            const isNonWorkingDay = isWeekend || isColombianHoliday;
                            
                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`w-12 flex-shrink-0 p-1 text-center border-r
                                        ${isNonWorkingDay ? 'bg-gray-100' : 'bg-white'}
                                        ${isColombianHoliday && !isWeekend ? 'bg-red-50' : ''}
                                        ${isToday(date) ? 'border-b-2 border-blue-500' : ''}`}
                                    title={`${date.toLocaleDateString('es-ES', { 
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}${isColombianHoliday ? ' - Día festivo en Colombia' : ''}`}
                                >
                                    <div className={`text-xs ${isNonWorkingDay ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                                        {dayName}
                                    </div>
                                    <div className={`text-sm 
                                        ${isToday(date) ? 'font-bold text-blue-600' : ''} 
                                        ${isNonWorkingDay ? 'text-red-600' : ''}`}>
                                        {day}
                                    </div>
                                    {isColombianHoliday && !isWeekend && (
                                        <div className="h-1 w-full bg-red-300 rounded-full mt-0.5"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filas de analistas */}
                <div>
                    {filteredAnalysts.map(analyst => {
                        const analystProjects = getProjectsForAnalyst(analyst.name);

                        return (
                            <div key={analyst.id} className="flex border-b hover:bg-gray-50">
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
                                    {dates.map((date) => {
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const isColombianHoliday = isHoliday(date);
                                        const isNonWorkingDay = isWeekend || isColombianHoliday;
                                        
                                        return (
                                            <div
                                                key={date.toISOString()}
                                                className={`w-12 flex-shrink-0 border-r relative
                                                    ${isNonWorkingDay ? 'bg-gray-100' : ''}
                                                    ${isColombianHoliday && !isWeekend ? 'bg-red-50' : ''}
                                                    ${isToday(date) ? 'bg-blue-50' : ''}`}
                                            >
                                                {/* No mostramos proyectos en días no laborables */}
                                                {!isNonWorkingDay && analystProjects.map(project => {
                                                    if (!isProjectActive(project, date)) return null;
                                                    const jiraUrl = getJiraUrl(project.idJira);
                                                    return (
                                                        <div key={project.idJira}>
                                                            {jiraUrl ? (
                                                                <a
                                                                    href={jiraUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title={renderProjectTooltip(project)}
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
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>                {/* Información sobre la fecha seleccionada */}
                <div className="mt-4 text-center">
                    <span className="font-semibold">
                        {selectedDateFilter === 'week' 
                            ? `Semana del ${formatDate(startDate)}` 
                            : selectedDateFilter === 'year'
                            ? startDate.getFullYear()
                            : startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    );
}
