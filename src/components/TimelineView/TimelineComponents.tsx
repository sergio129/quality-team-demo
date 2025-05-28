/**
 * Componentes modulares para la vista de calendario
 * 
 * Este archivo contiene componentes individuales memoizados que se utilizan
 * en la vista de calendario para mejorar el rendimiento mediante la reducción
 * de re-renderizados innecesarios.
 */

"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { memo, useMemo } from 'react';
import { getJiraUrl } from '@/utils/jiraUtils';
import Holidays from 'date-holidays';
import { formatDate, isProjectActive, normalizeDate } from './TimelineUtils';

// Inicializar la instancia de Holidays para Colombia
const holidays = new Holidays('CO');

// Caché para reducir llamadas a isHoliday
const holidayCache = new Map<string, boolean>();

// Función para verificar si una fecha es día festivo en Colombia (con caché)
const isHoliday = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    
    // Si el resultado está en caché, devolverlo
    if (holidayCache.has(dateString)) {
        return holidayCache.get(dateString) as boolean;
    }
    
    // Si no está en caché, calcularlo y guardarlo
    const result = !!holidays.isHoliday(date);
    holidayCache.set(dateString, result);
    return result;
};

// Función para verificar si una fecha es hoy
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

// Función para determinar si un día es laborable
export const isWorkingDay = (date: Date): boolean => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0=Domingo, 6=Sábado
    if (isWeekend) return false;
    
    return !isHoliday(date);
};

// Componente para mostrar un día en el encabezado (memoizado)
export const DateHeaderCell = memo(({ date }: { date: Date }) => {
    const day = date.getDate();
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const isCurrentDay = isToday(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isColombianHoliday = isHoliday(date);
    const isNonWorkingDay = isWeekend || isColombianHoliday;

    return (
        <div
            className={`w-12 flex-shrink-0 p-1 text-center border-r
                ${isNonWorkingDay ? 'bg-gray-100' : 'bg-white'}
                ${isColombianHoliday && !isWeekend ? 'bg-red-50' : ''}
                ${isCurrentDay ? 'border-b-2 border-blue-500' : ''}`}
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
                ${isCurrentDay ? 'font-bold text-blue-600' : ''} 
                ${isNonWorkingDay ? 'text-red-600' : ''}`}
            >
                {day}
            </div>
            {isColombianHoliday && !isWeekend && (
                <div className="h-1 w-full bg-red-300 rounded-full mt-0.5"></div>
            )}
        </div>
    );
});
DateHeaderCell.displayName = 'DateHeaderCell';

// Componente para mostrar un proyecto en una celda (memoizado)
export const ProjectItem = memo(({ 
    project, 
    date,
    analysts
}: { 
    project: Project; 
    date: Date;
    analysts: QAAnalyst[];
}) => {
    // Buscar al analista asignado para usar su color como base
    const assignedAnalyst = useMemo(() => 
        analysts.find(a => a.name === project.analistaProducto),
        [analysts, project.analistaProducto]
    );
    
    const analystColor = assignedAnalyst?.color ?? '#3B82F6'; // Azul como color por defecto
    
    const projectStyle = useMemo(() => {
        const today = new Date();
        const todayTimestamp = normalizeDate(today);
        
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
        const fechaEntregaTimestamp = project.fechaEntrega ? normalizeDate(project.fechaEntrega) : 0;
        if (fechaEntregaTimestamp < todayTimestamp) {
            // Ha pasado la fecha de entrega y no está certificado
            return {
                backgroundColor: '#FFEDD5', // bg-orange-200
                borderColor: '#FB923C', // orange-400
                borderWidth: '2px'
            };
        }

        // Proyecto en curso dentro del plazo usando el color del analista
        return style;
    }, [project, analystColor]);

    const tooltipContent = useMemo(() => {
        const today = new Date();
        const fechaEntrega = project.fechaEntrega ? new Date(project.fechaEntrega) : null;
        let estado = '';

        if (project.fechaCertificacion) {
            if (project.diasRetraso > 0) {
                estado = '⚠️ Finalizado con retraso';
            } else {
                estado = '✅ Finalizado a tiempo';
            }
        } else if (fechaEntrega && fechaEntrega < today) {
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
    }, [project]);

    const jiraUrl = getJiraUrl(project.idJira);

    if (jiraUrl) {
        return (
            <a
                href={jiraUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={tooltipContent}
                className="mx-1 text-xs p-1 rounded shadow-sm transition-colors cursor-pointer block"
                style={projectStyle}
            >
                {project.idJira}
            </a>
        );
    }

    return (
        <span
            title={tooltipContent}
            className="mx-1 text-xs p-1 rounded shadow-sm block"
            style={projectStyle}
        >
            {project.idJira}
        </span>
    );
});
ProjectItem.displayName = 'ProjectItem';

// Componente para mostrar un día en la celda de un analista
export const DayCell = memo(({ 
    date, 
    analystProjects, 
    analysts 
}: { 
    date: Date; 
    analystProjects: Project[]; 
    analysts: QAAnalyst[];
}) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isColombianHoliday = isHoliday(date);
    const isNonWorkingDay = isWeekend || isColombianHoliday;
    const isWorkDay = !isNonWorkingDay;
    
    // Este cálculo ahora está memoizado
    const activeProjects = useMemo(() => {
        if (!isWorkDay) return [];
        
        return analystProjects.filter(project => 
            isProjectActive(project, date, isWorkDay)
        );
    }, [analystProjects, date, isWorkDay]);

    return (
        <div
            className={`w-12 flex-shrink-0 border-r relative
                ${isNonWorkingDay ? 'bg-gray-100' : ''}
                ${isColombianHoliday && !isWeekend ? 'bg-red-50' : ''}
                ${isToday(date) ? 'bg-blue-50' : ''}`}
        >
            {isWorkDay && activeProjects.map(project => (
                <div key={project.idJira}>
                    <ProjectItem 
                        project={project} 
                        date={date}
                        analysts={analysts} 
                    />
                </div>
            ))}
        </div>
    );
});
DayCell.displayName = 'DayCell';

// Componente para mostrar una fila de un analista
export const AnalystRow = memo(({ 
    analyst, 
    dates, 
    projects, 
    filterEquipo 
}: { 
    analyst: QAAnalyst; 
    dates: Date[]; 
    projects: Project[]; 
    filterEquipo?: string; 
}) => {
    // Memoizar los proyectos filtrados por analista
    const analystProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesAnalista = p.analistaProducto === analyst.name;
            const matchesEquipo = !filterEquipo || p.equipo === filterEquipo;
            return matchesAnalista && matchesEquipo;
        });
    }, [projects, analyst.name, filterEquipo]);

    return (
        <div className="flex border-b hover:bg-gray-50">
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
                    <DayCell 
                        key={date.toISOString()} 
                        date={date} 
                        analystProjects={analystProjects} 
                        analysts={[analyst]} // Solo pasamos el analista actual
                    />
                ))}
            </div>
        </div>
    );
});
AnalystRow.displayName = 'AnalystRow';
