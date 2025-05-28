/**
 * VirtualizedTimeline Component
 * 
 * Este componente implementa la virtualización para la vista de calendario,
 * lo que permite manejar grandes cantidades de datos sin problemas de rendimiento.
 * 
 * Utiliza react-window para renderizar solo los elementos visibles en la ventana.
 */

"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { memo, useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import { clearProjectCache } from './TimelineUtils';
import { AnalystRow } from './TimelineComponents';

interface VirtualizedTimelineProps {
    dates: Date[];
    analysts: QAAnalyst[];
    projects: Project[];
    filterEquipo?: string;
    filterAnalista?: string;
}

export const VirtualizedTimeline = memo(({ 
    dates, 
    analysts, 
    projects, 
    filterEquipo,
    filterAnalista
}: VirtualizedTimelineProps) => {
    // Filtrar analistas basado en los criterios de filtro
    const filteredAnalysts = useMemo(() => {
        return analysts.filter(analyst => {
            if (filterAnalista && analyst.name !== filterAnalista) return false;
            return true;
        });
    }, [analysts, filterAnalista]);

    // Limpiar caché cuando cambian los proyectos o fechas
    useMemo(() => {
        clearProjectCache();
    }, [projects, dates]);

    // Altura de cada fila (ajustar según el tamaño de las filas de analistas)
    const rowHeight = 50;
    
    // Obtener el ancho del contenedor para calcular dimensiones
    const containerWidth = window?.innerWidth ? Math.min(window.innerWidth - 40, 1200) : 800;
    const containerHeight = Math.min(
        filteredAnalysts.length * rowHeight, 
        window?.innerHeight ? window.innerHeight * 0.7 : 500
    );

    // Renderizado de cada fila (virtualizado)
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const analyst = filteredAnalysts[index];
        if (!analyst) return null;
        
        return (
            <div style={style}>
                <AnalystRow 
                    analyst={analyst}
                    dates={dates}
                    projects={projects}
                    filterEquipo={filterEquipo}
                />
            </div>
        );
    };

    return (
        <div className="overflow-hidden border rounded-lg shadow bg-white">
            {/* Header fijo con nombres de días */}
            <div className="flex border-b">
                <div className="w-40 flex-shrink-0 p-2 font-semibold bg-gray-100 border-r">
                    Analista
                </div>
                <div className="flex overflow-x-auto">
                    {/* Implementación del encabezado con fechas (este no se virtualiza) */}
                    {/* La implementación viene del componente original DateHeaderCell */}
                </div>
            </div>

            {/* Lista virtualizada de analistas */}
            <FixedSizeList
                height={containerHeight}
                width={containerWidth}
                itemCount={filteredAnalysts.length}
                itemSize={rowHeight}
                overscanCount={3} // Render extra rows for smoother scrolling
            >
                {Row}
            </FixedSizeList>
        </div>
    );
});

VirtualizedTimeline.displayName = 'VirtualizedTimeline';
