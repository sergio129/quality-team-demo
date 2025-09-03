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
 */
export const isNonWorkingDay = (date: Date): boolean => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0=Domingo, 6=Sábado
    const isColombianHoliday = isHoliday(date);
    return isWeekend || isColombianHoliday;
};

/**
 * Calcula los días laborables entre dos fechas (excluyendo fines de semana y festivos)
 */
export const getWorkingDaysBetweenDates = (startDate: Date, endDate: Date): number => {
    // Validar que las fechas sean válidas
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('❌ INVALID DATES:', { startDate, endDate });
        return 0;
    }
    
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
 * Crea una fecha segura sin problemas de timezone
 * Si recibe un string en formato YYYY-MM-DD, crea una fecha local
 * Si recibe un string ISO completo, extrae la parte de fecha y crea fecha local
 */
export const createSafeDate = (dateInput: string | Date | null | undefined): Date | null => {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
        return dateInput;
    }
    
    if (typeof dateInput === 'string') {
        // Si es formato ISO con timezone (YYYY-MM-DDTHH:mm:ss.sssZ), extraer solo la fecha
        if (dateInput.includes('T')) {
            const dateOnly = dateInput.split('T')[0];
            const [year, month, day] = dateOnly.split('-').map(Number);
            return new Date(year, month - 1, day); // Crear fecha local sin zona horaria
        }
        
        // Si es formato YYYY-MM-DD, crear fecha local
        if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateInput.split('-').map(Number);
            return new Date(year, month - 1, day); // Crear fecha local sin zona horaria
        }
        
        // Para otros formatos, usar el constructor por defecto
        return new Date(dateInput);
    }
    
    return null;
};

/**
 * Convierte una fecha a string en formato YYYY-MM-DD para inputs de fecha
 */
export const dateToInputString = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const safeDate = createSafeDate(date);
    if (!safeDate) return '';
    
    const year = safeDate.getFullYear();
    const month = (safeDate.getMonth() + 1).toString().padStart(2, '0');
    const day = safeDate.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha según la localización es-ES usando fecha segura
 */
export const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    
    const safeDate = createSafeDate(date);
    if (!safeDate) return '';
    
    return safeDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * Obtiene la fecha y hora actual formateadas de manera segura
 */
export const getCurrentDateTime = () => {
    const now = new Date();
    return {
        date: formatDate(now),
        time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        dateTime: now.toLocaleString('es-ES')
    };
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
 */
export const getWorkingDatesArray = (startDate: Date, endDate: Date): Date[] => {
    const workingDates: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Normalizar para evitar problemas con horas/minutos/segundos
    currentDate.setHours(0, 0, 0, 0);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);
    
    while (currentDate <= normalizedEndDate) {
        if (!isNonWorkingDay(new Date(currentDate))) {
            workingDates.push(new Date(currentDate));
        }
        
        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDates;
};
