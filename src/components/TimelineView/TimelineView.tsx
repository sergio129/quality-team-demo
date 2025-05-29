"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { AnalystVacation } from '@/models/AnalystVacation';
import { useState, useEffect, useMemo, useCallback, memo, ReactNode } from 'react';
import { getJiraUrl } from '@/utils/jiraUtils';
import { isAnalystOnVacation } from '@/hooks/useAnalystVacations';
import Holidays from 'date-holidays';

// Inicializar la instancia de Holidays para Colombia
const holidays = new Holidays('CO');

// Caché para reducir llamadas a isHoliday
const holidayCache = new Map<string, boolean>();

// Función para verificar si una fecha es día festivo en Colombia (con caché)
const isHoliday = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    
    if (holidayCache.has(dateString)) {
        return holidayCache.get(dateString) as boolean;
    }
    
    const result = !!holidays.isHoliday(date);
    holidayCache.set(dateString, result);
    return result;
};

// Función para verificar si una fecha es hoy
const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

// Formateo consistente de fechas para comparaciones
const normalizeDate = (date: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Convertimos a UTC para evitar problemas con horarios de verano y zonas horarias
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

// Componente para mostrar un día en el encabezado (memoizado)
const DateHeaderCell = memo(({ date }: { date: Date }) => {
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
const ProjectItem = memo(({ 
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
        const todayStr = today.toISOString().split('T')[0];
        
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
        const fechaEntregaStr = project.fechaEntrega ? new Date(project.fechaEntrega).toISOString().split('T')[0] : '';
        if (fechaEntregaStr < todayStr) {
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
const DayCell = memo(({ 
    date, 
    analystProjects, 
    analysts,
    analystId,
    vacations = []
}: { 
    date: Date; 
    analystProjects: Project[]; 
    analysts: QAAnalyst[];
    analystId: string;
    vacations?: AnalystVacation[];
}) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isColombianHoliday = isHoliday(date);
    const isNonWorkingDay = isWeekend || isColombianHoliday;
    
    // Verificar si el analista está de vacaciones en esta fecha
    const vacation = isAnalystOnVacation(vacations, analystId, date);
    const isOnVacation = !!vacation;
    
    // Este cálculo ahora está memoizado
    const activeProjects = useMemo(() => {
        if (isNonWorkingDay) return [];
        
        return analystProjects.filter(project => {
            // Si no hay fechaEntrega, no podemos determinar si está activo
            if (!project.fechaEntrega) return false;
            
            // Convertir fechas a formato ISO para comparaciones consistentes
            const compareStr = date.toISOString().split('T')[0];
            const entregaStr = project.fechaEntrega ? new Date(project.fechaEntrega).toISOString().split('T')[0] : '';
            const certificacionStr = project.fechaCertificacion ? new Date(project.fechaCertificacion).toISOString().split('T')[0] : '';
            const todayStr = new Date().toISOString().split('T')[0];
            
            // CASO 1: Proyecto certificado - mostrar solo entre fecha entrega y certificación (inclusive)
            if (certificacionStr) {
                // Incluimos tanto la fecha de entrega como la fecha de certificación
                return compareStr >= entregaStr && compareStr <= certificacionStr;
            }
            
            // CASO 2: Proyecto no certificado
            // Mostrar si es el día exacto de entrega o después de la entrega y hasta hoy
            return (compareStr === entregaStr) || 
                   (compareStr > entregaStr && compareStr <= todayStr);
        });
    }, [analystProjects, date, isNonWorkingDay]);

    return (
        <div
            className={`w-12 flex-shrink-0 border-r relative
                ${isNonWorkingDay ? 'bg-gray-100' : ''}
                ${isColombianHoliday && !isWeekend ? 'bg-red-50' : ''}
                ${isToday(date) ? 'bg-blue-50' : ''}
                ${isOnVacation ? 'bg-purple-50' : ''}`}
            title={isOnVacation ? `Vacaciones: ${vacation?.description || 'Sin descripción'}` : ''}
        >
            {/* Mostrar indicador de vacaciones cuando corresponda */}
            {isOnVacation && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-full h-full bg-purple-100 bg-opacity-70 flex items-center justify-center">
                        <span className="text-xs text-purple-800 font-medium px-1 py-0.5 bg-white bg-opacity-70 rounded">
                            {vacation?.type === 'vacation' ? 'Vacaciones' : 
                             vacation?.type === 'training' ? 'Capacitación' : 
                             vacation?.type === 'leave' ? 'Permiso' : 'Ausente'}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Mostrar proyectos solo si no está de vacaciones y no es día no laborable */}
            {!isOnVacation && !isNonWorkingDay && activeProjects.map(project => (
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
const AnalystRow = memo(({ 
    analyst, 
    dates, 
    projects, 
    filterEquipo, 
    analysts,
    vacations = []
}: { 
    analyst: QAAnalyst; 
    dates: Date[]; 
    projects: Project[]; 
    filterEquipo?: string;
    analysts: QAAnalyst[];
    vacations?: AnalystVacation[];
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
                        analysts={analysts}
                        analystId={analyst.id}
                        vacations={vacations}
                    />
                ))}
            </div>
        </div>
    );
});
AnalystRow.displayName = 'AnalystRow';

interface TimelineViewProps {
    projects: Project[];
    analysts: QAAnalyst[];
    filterEquipo?: string;
    filterAnalista?: string;
    startDate: Date;
    endDate: Date | null;
    selectedDateFilter: 'week' | 'month' | 'custom-month' | 'custom';
    vacations?: AnalystVacation[]; // Nueva prop para vacaciones
}

export function TimelineView({ 
    projects, 
    analysts, 
    filterEquipo, 
    filterAnalista,
    startDate,
    endDate,
    selectedDateFilter,
    vacations = [] // Valor por defecto: array vacío
}: Readonly<TimelineViewProps>): ReactNode {
    const [dates, setDates] = useState<Date[]>([]);    const [pageSize, setPageSize] = useState(10); // Número de analistas a mostrar por página
    const [currentPage, setCurrentPage] = useState(0); // Página actual
    
    // Efecto para actualizar el calendario basado en los filtros de fecha del padre
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
                case 'custom-month':
                    // Fin del mes (ya sea actual o seleccionado)
                    calculatedEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    break;
            }
        }
        
        // Limitamos el máximo de fechas a mostrar para evitar problemas de rendimiento
        const maxDatesToShow = 90; // Máximo número de días que mostraremos en cualquier vista
        
        // Generar el array de fechas a mostrar
        let daysCount = 0;
        while (currentDate <= calculatedEndDate && daysCount < maxDatesToShow) {
            newDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
            daysCount++;
        }
        
        console.log(`Generadas ${newDates.length} fechas para la vista de ${selectedDateFilter}`);
        setDates(newDates);
    }, [startDate, endDate, selectedDateFilter]);

    // Limpieza de caché cuando cambian los proyectos o filtros relevantes
    useEffect(() => {
        // Importamos la función de limpieza de caché desde TimelineUtils
        import('./TimelineUtils').then(({ clearProjectCache }) => {
            console.log('[TimelineView] Limpiando caché debido a cambios en proyectos o filtros');
            clearProjectCache();
        });
    }, [projects, filterEquipo, filterAnalista, startDate, endDate]);

    // Filtrar analistas basado en los criterios
    const filteredAnalysts = useMemo(() => {
        return analysts.filter(analyst => {
            if (filterAnalista && analyst.name !== filterAnalista) return false;
            return true;
        });
    }, [analysts, filterAnalista]);
    
    // Formatear fecha para el encabezado
    const dateHeader = useMemo(() => {
        if (selectedDateFilter === 'week') {
            return `Semana del ${startDate.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'UTC'
            })}`;
        } else {
            return startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }
    }, [selectedDateFilter, startDate]);

    // Calcular el número total de páginas
    const totalPages = Math.ceil(filteredAnalysts.length / pageSize);
    
    // Obtener los analistas para la página current
    const currentAnalysts = useMemo(() => {
        const start = currentPage * pageSize;
        return filteredAnalysts.slice(start, start + pageSize);
    }, [filteredAnalysts, currentPage, pageSize]);

    // Manejadores para la paginación
    const handlePrevPage = useCallback(() => {
        setCurrentPage(prev => Math.max(0, prev - 1));
    }, []);
    
    const handleNextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    }, [totalPages]);

    // Determinar si el viewport es pequeño para ajustar el número de analistas mostrados
    useEffect(() => {
        const updatePageSize = () => {
            // En dispositivos móviles o pantallas pequeñas, mostrar menos analistas por página
            if (window.innerWidth < 768) {
                setPageSize(5);
            } else {
                setPageSize(10);
            }
        };
        
        updatePageSize();
        window.addEventListener('resize', updatePageSize);
        
        return () => {
            window.removeEventListener('resize', updatePageSize);
        };    }, []);    return (
        <div className="flex flex-col w-full overflow-hidden">
            {/* Cabecera con la fecha o rango seleccionado */}
            <div className="bg-white p-4 border-b shadow-sm mb-4 rounded-t-lg flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    Mostrando {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredAnalysts.length)} de {filteredAnalysts.length} analistas
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className={`px-3 py-1 rounded ${
                            currentPage === 0 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        Anterior
                    </button>
                    <button 
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        className={`px-3 py-1 rounded ${
                            currentPage >= totalPages - 1
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <div className="min-w-max">
                    {/* Header con fechas */}
                    <div className="flex border-b">
                        <div className="w-40 flex-shrink-0 p-2 font-semibold bg-gray-100 border-r">
                            Analista
                        </div>
                        <div className="flex">
                            {dates.map((date) => (
                                <DateHeaderCell key={date.toISOString()} date={date} />
                            ))}
                        </div>
                    </div>

                    {/* Filas de analistas - solo renderizamos los de la página actual */}
                    <div>
                        {currentAnalysts.map(analyst => (
                            <AnalystRow 
                                key={analyst.id} 
                                analyst={analyst} 
                                dates={dates} 
                                projects={projects} 
                                filterEquipo={filterEquipo}
                                analysts={filteredAnalysts}
                                vacations={vacations.filter(v => v.analystId === analyst.id)}
                            />
                        ))}
                    </div>

                    {/* Información sobre la fecha seleccionada */}
                    <div className="mt-4 text-center">
                        <span className="font-semibold">{dateHeader}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
