// Script para verificar que la migración está completa
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');
const OLD_VACATIONS_FILE = path.join(DATA_DIR, 'analyst-vacations.json.deprecated');

async function verifyMigration() {
  console.log('Verificando la migración de vacaciones...');
  
  // Verificar las vacaciones en PostgreSQL
  const vacationsInDB = await prisma.analystVacation.findMany();
  console.log(`Vacaciones en PostgreSQL: ${vacationsInDB.length}`);
  
  // Verificar si el archivo JSON ya no existe o ha sido renombrado
  const jsonExists = fs.existsSync(path.join(DATA_DIR, 'analyst-vacations.json'));
  const deprecatedExists = fs.existsSync(OLD_VACATIONS_FILE);
  
  if (!jsonExists) {
    console.log('✅ El archivo analyst-vacations.json ya no existe (correcto)');
  } else {
    console.log('⚠️ El archivo analyst-vacations.json aún existe. Considera renombrarlo.');
  }
  
  if (deprecatedExists) {
    console.log('✅ Existe una copia de respaldo del archivo (analyst-vacations.json.deprecated)');
  }
  
  // Verificar la configuración de migración
  const migrationConfig = require('../src/config/migration');
  if (migrationConfig.services.vacations === true) {
    console.log('✅ La configuración de migración tiene habilitado el uso de PostgreSQL para vacaciones');
  } else {
    console.log('⚠️ La configuración de migración no tiene habilitado el uso de PostgreSQL para vacaciones');
  }
  
  // Resumen
  console.log('\nResumen:');
  console.log('=======');
  console.log(`- Datos migrados a PostgreSQL: ${vacationsInDB.length} registros`);
  console.log('- Archivo JSON original: ' + (jsonExists ? 'Aún existe (debe renombrarse)' : 'Eliminado/Renombrado (correcto)'));
  console.log('- Servicio de vacaciones configurado para usar PostgreSQL: ' + (migrationConfig.services.vacations === true ? 'Sí' : 'No'));
  
  await prisma.$disconnect();
}

verifyMigration().catch(e => {
  console.error('Error al verificar la migración:', e);
  process.exit(1);
});
