"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { useEffect, useState } from 'react';

interface TimelineViewProps {
    projects: Project[];
    analysts: QAAnalyst[];
}

export function TimelineView({ projects, analysts }: TimelineViewProps) {
    const [dates, setDates] = useState<Date[]>([]);
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        // Comenzar desde el primer día del mes actual
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    // Generar fechas para un mes
    useEffect(() => {
        const newDates: Date[] = [];
        const currentDate = new Date(startDate);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Generar fechas hasta el último día del mes
        while (currentDate <= lastDayOfMonth) {
            newDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setDates(newDates);
    }, [startDate]);

    // Obtener proyectos por analista
    const getProjectsForAnalyst = (analystName: string) => {
        return projects.filter(p => p.analistaProducto === analystName);
    };

    const formatDate = (date: Date) => {
        return date.getDate() + ' ' + date.toLocaleDateString('es-ES', { month: 'short' });
    };

    // Verificar si un proyecto está activo en una fecha dada
    const isProjectActive = (project: Project, date: Date) => {
        const projectDate = new Date(project.fechaEntrega);
        const projectEndDate = project.fechaCertificacion ? new Date(project.fechaCertificacion) : 
                             project.fechaRealEntrega ? new Date(project.fechaRealEntrega) :
                             new Date(project.fechaEntrega);

        // Asegurarnos de que comparamos solo las fechas sin la hora
        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(projectDate.getFullYear(), projectDate.getMonth(), projectDate.getDate());
        const endDate = new Date(projectEndDate.getFullYear(), projectEndDate.getMonth(), projectEndDate.getDate());

        return compareDate >= startDate && compareDate <= endDate;
    };

    // Función para determinar el color del proyecto
    const getProjectColor = (project: Project) => {
        if (project.fechaCertificacion) return 'bg-green-200'; // Certificado
        if (project.fechaRealEntrega) {
            const isDelayed = project.diasRetraso > 0;
            return isDelayed ? 'bg-red-200' : 'bg-blue-200';
        }
        return 'bg-gray-200'; // En progreso
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
                        {dates.map((date) => (
                            <div
                                key={date.toISOString()}
                                className={`w-12 flex-shrink-0 p-2 text-center text-xs border-r ${
                                    date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100' : 'bg-white'
                                }`}
                            >
                                {formatDate(date)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filas de analistas */}
                <div>
                    {analysts.map(analyst => {
                        const analystProjects = getProjectsForAnalyst(analyst.name);

                        return (
                            <div key={analyst.id} className="flex border-b">
                                <div className="w-40 flex-shrink-0 p-2 border-r">
                                    {analyst.name}
                                </div>
                                <div className="flex relative min-h-[50px]">
                                    {dates.map((date) => (
                                        <div
                                            key={date.toISOString()}
                                            className={`w-12 flex-shrink-0 border-r ${
                                                date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                                            }`}
                                        >
                                            {analystProjects.map(project => (
                                                isProjectActive(project, date) && (
                                                    <div
                                                        key={project.idJira}
                                                        className={`mx-1 text-xs p-1 rounded ${getProjectColor(project)}`}
                                                        title={`${project.idJira} - ${project.proyecto}`}
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
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
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
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                        Mes siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
