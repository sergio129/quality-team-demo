// Test final usando 100% fechas locales (igual que el calendario)
const Holidays = require('date-holidays');

const holidays = new Holidays('CO');

const isHoliday = (date) => {
    const holiday = holidays.isHoliday(date);
    return !!holiday;
};

const isNonWorkingDay = (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // LOCAL
    const isColombianHoliday = isHoliday(date);
    return isWeekend || isColombianHoliday;
};

const getWorkingDatesArray = (startDate, endDate) => {
    const workingDates = [];
    
    // FECHAS LOCALES (igual que el calendario)
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
    
    console.log('=== Test FINAL con fechas 100% locales ===');
    
    while (currentDate <= finalDate) {
        const testDate = new Date(currentDate);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getDay(); // LOCAL
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
        
        // Avanzar usando tiempo local
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDates;
};

// Test para SRCA-0000 usando fechas locales
const startDate = new Date('2025-08-14');
const endDate = new Date('2025-08-29');

const workingDates = getWorkingDatesArray(startDate, endDate);

console.log('\n=== Resultado FINAL sincronizado con calendario ===');
console.log('Total días laborales:', workingDates.length);
console.log('Días laborales:');
workingDates.forEach((date, index) => {
    console.log(`  ${index}: ${date.toISOString().split('T')[0]}`);
});
