// Este script normaliza las fechas en el archivo de vacaciones
// para garantizar que todas tengan el formato correcto
const fs = require('fs');
const path = require('path');

// Ruta al archivo de vacaciones
const VACATIONS_FILE = path.join(process.cwd(), 'data', 'analyst-vacations.json');

try {
  console.log('Normalizando fechas de vacaciones...');
  
  // Leer el archivo
  const rawData = fs.readFileSync(VACATIONS_FILE, 'utf8');
  const vacations = JSON.parse(rawData);
  
  console.log(`Encontradas ${vacations.length} entradas de vacaciones`);
  
  // Normalizar cada fecha
  vacations.forEach(vacation => {
    // Normalizar fechas
    if (vacation.startDate) {
      const date = new Date(vacation.startDate);
      date.setUTCHours(0, 0, 0, 0);
      vacation.startDate = date.toISOString();
      console.log(`Fecha de inicio normalizada: ${vacation.startDate}`);
    }
    
    if (vacation.endDate) {
      const date = new Date(vacation.endDate);
      date.setUTCHours(23, 59, 59, 999); // Fin del día
      vacation.endDate = date.toISOString();
      console.log(`Fecha de fin normalizada: ${vacation.endDate}`);
    }
  });
  
  // Guardar los cambios
  fs.writeFileSync(VACATIONS_FILE, JSON.stringify(vacations, null, 2));
  console.log('Fechas normalizadas y guardadas correctamente');
  
} catch (error) {
  console.error('Error al normalizar fechas:', error);
}
