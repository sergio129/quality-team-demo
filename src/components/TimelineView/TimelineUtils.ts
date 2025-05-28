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
 * Retorna el timestamp a medianoche en UTC
 * 
 * Esta función garantiza:
 * 1. Crear un nuevo objeto Date para evitar modificar la fecha original
 * 2. Usar UTC para evitar problemas con cambios de horario de verano/invierno
 * 3. Convertir a timestamp para comparaciones numéricas más precisas
 * 
 * IMPORTANTE: Para evitar problemas de zona horaria en comparaciones, es recomendable
 * convertir el resultado a formato YYYY-MM-DD usando toISOString().split('T')[0]
 */
export const normalizeDate = (date: Date | string): number => {
    if (!date) return 0;
    
    // Si es una cadena, convertir a objeto Date
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    
    // Crear una nueva fecha usando solo los componentes de año, mes y día
    // Esto elimina la hora, minutos, segundos y milisegundos para una comparación justa
    // Utilizamos Date.UTC para crear un timestamp consistente independiente de la zona horaria local
    const timestamp = Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        0, 0, 0, 0
    );
    
    return timestamp;
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
      // Convertir fechas a formato ISO para comparaciones sencillas y consistentes
    const compareStr = date.toISOString().split('T')[0];
    const entregaStr = project.fechaEntrega ? new Date(project.fechaEntrega).toISOString().split('T')[0] : '';
    const certificacionStr = project.fechaCertificacion ? new Date(project.fechaCertificacion).toISOString().split('T')[0] : '';
    const todayStr = new Date().toISOString().split('T')[0];    
    let result = false;
    
    // CASO 1: Proyecto certificado - mostrar solo entre fecha entrega y certificación
    if (certificacionStr) {
        // Proyecto certificado - mostrar en todas las fechas desde entrega hasta certificación (inclusive)
        // Comparamos las fechas en formato YYYY-MM-DD para evitar problemas de zona horaria
        result = compareStr >= entregaStr && compareStr <= certificacionStr;
    } else {
        // CASO 2: Proyecto no certificado
        // Mostrar si es el día exacto de entrega
        if (compareStr === entregaStr) {
            result = true;
        } else {
            // Mostrar si es después de la entrega y hasta hoy (en curso o retrasado)
            result = compareStr > entregaStr && compareStr <= todayStr;
        }
    }
    
    // Guardar en caché para futuras consultas
    projectActiveCache.set(cacheKey, result);
    
    return result;
};

/**
 * Limpia la caché cuando cambian los proyectos o fechas
 * Llamar esta función cuando se actualizan los datos de proyectos
 * 
 * @param projectId Opcional: ID del proyecto específico para limpiar solo su caché
 */
export const clearProjectCache = (projectId?: string): void => {
    if (projectId) {
        // Limpiar solo las entradas de caché para este proyecto específico
        const keysToDelete: string[] = [];
        projectActiveCache.forEach((_, key) => {
            if (key.startsWith(`${projectId}_`)) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => {
            projectActiveCache.delete(key);
        });
        
        console.log(`[TimelineUtils] Caché limpiada para proyecto ${projectId}`);
    } else {
        // Limpiar toda la caché
        projectActiveCache.clear();
        console.log('[TimelineUtils] Caché limpiada completamente');
    }
};
