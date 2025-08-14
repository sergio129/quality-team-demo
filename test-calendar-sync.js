// Test usando EXACTAMENTE la misma lógica que el calendario
const Holidays = require('date-holidays');

const holidays = new Holidays('CO');

// Función IDÉNTICA a la del calendario
const isHoliday = (date) => {
    const holiday = holidays.isHoliday(date);
    return !!holiday;
};

// Función IDÉNTICA a la del calendario  
const isNonWorkingDay = (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // LOCAL (igual que calendario)
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
    
    console.log('=== Test con EXACTAMENTE la misma lógica del calendario ===');
    
    while (currentDate <= finalDate) {
        const testDate = new Date(currentDate);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getDay(); // LOCAL, igual que el calendario
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // LOCAL
        const isHolidayDay = isHoliday(testDate);
        const isNonWorking = isNonWorkingDay(testDate);
        
        console.log(`${dateStr} (${dayNames[dayOfWeek]}): Weekend=${isWeekend}, Holiday=${isHolidayDay}, NonWorking=${isNonWorking}`);
        
        if (!isNonWorking) {
            workingDates.push(new Date(currentDate));
        }
        
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return workingDates;
};

// Test para SRCA-0000
const startDate = new Date('2025-08-14T00:00:00.000Z');
const endDate = new Date('2025-08-29T00:00:00.000Z');

const workingDates = getWorkingDatesArray(startDate, endDate);

console.log('\n=== Resultado SINCRONIZADO con calendario ===');
console.log('Total días laborales:', workingDates.length);
console.log('Días laborales:');
workingDates.forEach((date, index) => {
    console.log(`  ${index}: ${date.toISOString().split('T')[0]}`);
});
