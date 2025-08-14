import Holidays from 'date-holidays';

// Inicializar la instancia de Holidays para Colombia
const holidays = new Holidays('CO');

/**
 * Verifica si una fecha es un día festivo en Colombia
 */
export const isHoliday = (date: Date): boolean => {
    const holiday = holidays.isHoliday(date);
    return !!holiday;
};

/**
 * Verifica si una fecha es un día no laborable (fin de semana o festivo)
 * IMPORTANTE: Usa la MISMA lógica que el calendario visual
 */
export const isNonWorkingDay = (date: Date): boolean => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0=Domingo, 6=Sábado (LOCAL, igual que el calendario)
    const isColombianHoliday = isHoliday(date);
    return isWeekend || isColombianHoliday;
};

/**
 * Calcula los días laborables entre dos fechas (excluyendo fines de semana y festivos)
 */
export const getWorkingDaysBetweenDates = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const currentDate = new Date(startDate);
    
    // Normalizar para evitar problemas con horas/minutos/segundos
    currentDate.setHours(0, 0, 0, 0);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);
    
    while (currentDate <= normalizedEndDate) {
        if (!isNonWorkingDay(currentDate)) {
            count++;
        }
        
        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
};

/**
 * Formatea una fecha según la localización es-ES
 */
export const formatDate = (date: Date | string | null | undefined) => {
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
 * Obtiene información detallada sobre un día festivo en Colombia
 * @returns Un objeto con el nombre del día festivo o null si no es festivo
 */
export const getHolidayInfo = (date: Date) => {
    return holidays.isHoliday(date);
};

/**
 * Obtiene un array con todas las fechas laborales entre dos fechas (excluyendo fines de semana y festivos)
 * IMPORTANTE: Usa fechas locales para sincronizar exactamente con el calendario visual
 */
export const getWorkingDatesArray = (startDate: Date, endDate: Date): Date[] => {
    const workingDates: Date[] = [];
    
    // Crear fechas usando tiempo local (igual que el calendario)
    const currentDate = new Date(
        startDate.getFullYear(), 
        startDate.getMonth(), 
        startDate.getDate()
    );
    const finalDate = new Date(
        endDate.getFullYear(), 
        endDate.getMonth(), 
        endDate.getDate()
    );
    
    while (currentDate <= finalDate) {
        if (!isNonWorkingDay(new Date(currentDate))) {
            workingDates.push(new Date(currentDate));
        }
        
        // Avanzar al siguiente día usando tiempo local
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDates;
};
