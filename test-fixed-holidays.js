// Test con la nueva función de feriados
const colombianHolidays2025 = [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Reyes Magos
    '2025-03-24', // San José (trasladado al lunes)
    '2025-04-17', // Jueves Santo
    '2025-04-18', // Viernes Santo
    '2025-05-01', // Día del Trabajo
    '2025-06-02', // Ascensión (trasladado al lunes)
    '2025-06-23', // Corpus Christi (trasladado al lunes)
    '2025-07-01', // Sagrado Corazón (trasladado al lunes)
    '2025-07-20', // Independencia
    '2025-08-07', // Batalla de Boyacá
    '2025-08-15', // Asunción (no se traslada, cae en viernes)
    '2025-10-13', // Día de la Raza (trasladado al lunes)
    '2025-11-03', // Independencia de Cartagena (trasladado al lunes)
    '2025-12-08', // Inmaculada Concepción
    '2025-12-25'  // Navidad
];

const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return colombianHolidays2025.includes(dateStr);
};

const isNonWorkingDay = (date) => {
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const isColombianHoliday = isHoliday(date);
    return isWeekend || isColombianHoliday;
};

const getWorkingDatesArray = (startDate, endDate) => {
    const workingDates = [];
    
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
    
    console.log('=== Test con feriados colombianos 2025 corregidos ===');
    
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
            console.log(`✅ ${dateStr} (${dayNames[dayOfWeek]}) - LABORABLE`);
        } else {
            const reason = isWeekend ? 'fin de semana' : 'feriado';
            console.log(`❌ ${dateStr} (${dayNames[dayOfWeek]}) - NO LABORABLE (${reason})`);
        }
        
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return workingDates;
};

// Test para SRCA-0000
const startDate = new Date('2025-08-14T00:00:00.000Z');
const endDate = new Date('2025-08-29T00:00:00.000Z');

const workingDates = getWorkingDatesArray(startDate, endDate);

console.log('\n=== Resultado con feriados corregidos ===');
console.log('Total días laborales:', workingDates.length);
console.log('Días laborales:');
workingDates.forEach((date, index) => {
    console.log(`  ${index}: ${date.toISOString().split('T')[0]}`);
});
