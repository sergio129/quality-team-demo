// Test específico con UTC corregido
const Holidays = require('date-holidays');

const holidays = new Holidays('CO');

const isHoliday = (date) => {
    const holiday = holidays.isHoliday(date);
    return !!holiday;
};

const isNonWorkingDay = (date) => {
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6; // CORREGIDO: usar getUTCDay()
    const isColombianHoliday = isHoliday(date);
    return isWeekend || isColombianHoliday;
};

const getWorkingDatesArray = (startDate, endDate) => {
    const workingDates = [];
    
    // Crear fechas usando UTC para evitar problemas de zona horaria
    const currentDate = new Date(Date.UTC(
        startDate.getUTCFullYear(), 
        startDate.getUTCMonth(), 
        startDate.getUTCDate()
    ));
    const finalDate = new Date(Date.UTC(
        endDate.getUTCFullYear(), 
        endDate.getUTCMonth(), 
        endDate.getUTCDate()
    ));
    
    console.log('=== Generando días laborales (CORREGIDO) ===');
    console.log('Fecha inicio:', currentDate.toISOString().split('T')[0]);
    console.log('Fecha fin:', finalDate.toISOString().split('T')[0]);
    console.log('');
    
    while (currentDate <= finalDate) {
        const testDate = new Date(currentDate);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getUTCDay();
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHolidayDay = isHoliday(testDate);
        const isNonWorking = isNonWorkingDay(testDate);
        
        if (!isNonWorking) {
            workingDates.push(new Date(currentDate));
            console.log(`✅ ${dateStr} (${dayNames[dayOfWeek]}) - AGREGADO como día laboral`);
        } else {
            const reason = isWeekend ? 'fin de semana' : 'feriado';
            console.log(`❌ ${dateStr} (${dayNames[dayOfWeek]}) - EXCLUIDO (${reason})`);
        }
        
        // Avanzar al siguiente día usando UTC
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return workingDates;
};

// Simular el proyecto SRCA-0000
const startDate = new Date('2025-08-14T00:00:00.000Z');
const endDate = new Date('2025-08-29T00:00:00.000Z');

const workingDates = getWorkingDatesArray(startDate, endDate);

console.log('\n=== Resultado final CORREGIDO ===');
console.log('Total días laborales:', workingDates.length);
console.log('Días laborales:');
workingDates.forEach((date, index) => {
    console.log(`  ${index}: ${date.toISOString().split('T')[0]}`);
});
