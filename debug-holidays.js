// Test para verificar días específicos
const Holidays = require('date-holidays');

// Configurar holidays para Colombia
const holidays = new Holidays('CO');

console.log('=== Verificando configuración de holidays ===');
console.log('País configurado:', holidays.getCountries());

// Test específico para agosto 2025
const dates = [
  '2025-08-18',
  '2025-08-19', 
  '2025-08-20',
  '2025-08-21',
  '2025-08-22',
  '2025-08-23',
  '2025-08-24',
  '2025-08-25',
  '2025-08-26'
];

console.log('\n=== Test de días específicos de agosto 2025 ===');
dates.forEach(dateStr => {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const dayOfWeek = date.getUTCDay();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const holiday = holidays.isHoliday(date);
  const isWorking = !isWeekend && !holiday;
  
  console.log(`${dateStr} (${dayNames[dayOfWeek]}): ${isWorking ? '✅ LABORABLE' : '❌ NO LABORABLE'} - Weekend: ${isWeekend}, Holiday: ${!!holiday}`);
  if (holiday) {
    console.log(`  📅 Feriado: ${holiday.name || 'Sin nombre'}`);
  }
});

console.log('\n=== Todos los feriados de Colombia en 2025 ===');
try {
  const allHolidays = holidays.getHolidays(2025);
  allHolidays.forEach(h => {
    const dateStr = h.date.toISOString().split('T')[0];
    console.log(`${dateStr}: ${h.name}`);
  });
} catch(e) {
  console.log('Error obteniendo feriados:', e.message);
}
