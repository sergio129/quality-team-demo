"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { useEffect, useState } from 'react';

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

    useEffect(() => {
        const newDates: Date[] = [];
        const currentDate = new Date(startDate);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        while (currentDate <= lastDayOfMonth) {
            newDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setDates(newDates);
    }, [startDate]);

    const filteredAnalysts = analysts.filter(analyst => {
        if (filterAnalista && analyst.name !== filterAnalista) return false;
        return true;
    });

    const getProjectsForAnalyst = (analystName: string) => {
        return projects.filter(p => {
            const matchesAnalista = p.analistaProducto === analystName;
            const matchesEquipo = !filterEquipo || p.equipo === filterEquipo;
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
        // Format day number
        const day = date.getDate();
        // Get day name abbreviation
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

        // Comparar las fechas normalizadas
        return compareDate >= startDateUTC && compareDate <= endDateUTC;
    };

    const getProjectColor = (project: Project) => {
        if (project.fechaCertificacion) {
            const isDelayed = project.diasRetraso > 0;
            return isDelayed ? 'bg-red-200 hover:bg-red-300' : 'bg-green-200 hover:bg-green-300';
        }
        return 'bg-blue-200 hover:bg-blue-300';
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-max">
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

                        return (
                            <div key={analyst.id} className="flex border-b hover:bg-gray-50">
                                <div className="w-40 flex-shrink-0 p-2 border-r">
                                    {analyst.name}
                                </div>
                                <div className="flex relative min-h-[50px]">
                                    {dates.map((date) => (
                                        <div
                                            key={date.toISOString()}
                                            className={`w-12 flex-shrink-0 border-r relative
                                                ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''}
                                                ${isToday(date) ? 'bg-blue-50' : ''}`}
                                        >
                                            {analystProjects.map(project => (
                                                isProjectActive(project, date) && (
                                                    <div
                                                        key={project.idJira}
                                                        className={`mx-1 text-xs p-1 rounded shadow-sm transition-colors
                                                            ${getProjectColor(project)} cursor-pointer`}
                                                        title={`${project.idJira} - ${project.proyecto}
Equipo: ${project.equipo}
Fecha Entrega: ${formatDate(project.fechaEntrega)}
${project.fechaCertificacion ? `Fecha Certificación: ${formatDate(project.fechaCertificacion)}` : ''}
${project.diasRetraso > 0 ? `Días de Retraso: ${project.diasRetraso}` : ''}`}
                                                    >
                                                        {project.idJira}
                                                    </div>
                                                )
                                            ))}
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
                            newDate.setMonth(newDate.getMonth() - 1);
                            setStartDate(newDate);
                        }}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        Mes anterior
                    </button>
                    <span className="font-semibold">
                        {startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => {
                            const newDate = new Date(startDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setStartDate(newDate);
                        }}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        Mes siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
