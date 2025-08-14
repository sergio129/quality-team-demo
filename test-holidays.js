const Holidays = require('date-holidays');
const holidays = new Holidays('CO');

// Probar días específicos de agosto 2025
const testDates = [
  '2025-08-19',
  '2025-08-25'
];

console.log('=== Probando días sospechosos ===');
testDates.forEach(dateStr => {
  const date = new Date(dateStr + 'T12:00:00.000Z');
  const holiday = holidays.isHoliday(date);
  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  console.log(`${dateStr}: ${holiday ? 'FERIADO' : 'LABORABLE'} - Día de la semana: ${date.getDay()} (${dayNames[date.getDay()]})`);
  if (holiday) {
    console.log('  Detalles:', holiday);
  }
});

console.log('\n=== Todos los feriados de agosto 2025 ===');
const holidays2025 = holidays.getHolidays(2025);
const augustHolidays = holidays2025.filter(h => h.date.getMonth() === 7); // Agosto = mes 7
augustHolidays.forEach(h => {
  console.log(`${h.date.toISOString().split('T')[0]}: ${h.name}`);
});
