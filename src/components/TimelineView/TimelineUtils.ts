/**
 * Utilidades para la vista de calendario (TimelineView)
 * Este archivo contiene funciones reutilizables para mejorar el rendimiento
 * de la vista de calendario, incluyendo cachés, memoización y formateo.
 */

import { Project } from '@/models/Project';

// Caché para resultados de isProjectActive
type ProjectActiveCacheKey = string;
type ProjectActiveCacheValue = boolean;
const projectActiveCache = new Map<ProjectActiveCacheKey, ProjectActiveCacheValue>();

/**
 * Genera una clave de caché única para un proyecto y una fecha específicos
 */
export const getProjectDateCacheKey = (projectId: string, dateString: string): string => {
    return `${projectId}_${dateString}`;
};

/**
 * Normaliza una fecha para comparaciones consistentes
 * Retorna el timestamp a medianoche
 */
export const normalizeDate = (date: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return d.setHours(0, 0, 0, 0);
};

/**
 * Formatea una fecha para mostrarla en la UI
 */
export const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
    });
};

/**
 * Verifica si un proyecto está activo en una fecha específica
 * Utiliza caché para mejorar el rendimiento en llamadas repetidas
 */
export const isProjectActive = (project: Project, date: Date, isWorkingDay: boolean): boolean => {
    // Si no es día laborable, no mostrar ningún proyecto
    if (!isWorkingDay) return false;
    
    // Si no hay fechaEntrega, no podemos determinar si está activo
    if (!project.fechaEntrega) return false;
    
    // Generar clave de caché
    const cacheKey = getProjectDateCacheKey(
        project.idJira || 'unknown',
        date.toISOString().split('T')[0]
    );
    
    // Verificar si el resultado está en caché
    if (projectActiveCache.has(cacheKey)) {
        return projectActiveCache.get(cacheKey) as boolean;
    }
    
    // Convertir fechas a timestamps para comparaciones más rápidas
    const compareTimestamp = normalizeDate(date);
    const entregaTimestamp = normalizeDate(project.fechaEntrega);
    const certificacionTimestamp = project.fechaCertificacion 
        ? normalizeDate(project.fechaCertificacion)
        : null;
    const todayTimestamp = normalizeDate(new Date());
    
    let result = false;
    
    // CASO 1: Proyecto certificado - mostrar solo entre fecha entrega y certificación
    if (certificacionTimestamp !== null) {
        result = compareTimestamp >= entregaTimestamp && compareTimestamp <= certificacionTimestamp;
    } else {
        // CASO 2: Proyecto no certificado
        // Mostrar si es el día exacto de entrega
        if (compareTimestamp === entregaTimestamp) {
            result = true;
        } else {
            // Mostrar si es después de la entrega y hasta hoy (en curso o retrasado)
            result = compareTimestamp > entregaTimestamp && compareTimestamp <= todayTimestamp;
        }
    }
    
    // Guardar en caché para futuras consultas
    projectActiveCache.set(cacheKey, result);
    
    return result;
};

/**
 * Limpia la caché cuando cambian los proyectos o fechas
 * Llamar esta función cuando se actualizan los datos de proyectos
 */
export const clearProjectCache = (): void => {
    projectActiveCache.clear();
};
