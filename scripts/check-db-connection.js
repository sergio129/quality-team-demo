// Script para verificar la conexión a la base de datos
const { PrismaClient } = require('@prisma/client');

async function checkConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Intentando conectar a la base de datos...');
    // Usamos una consulta simple para comprobar la conexión
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    
    console.log('Conexión exitosa. Fecha del servidor:', result[0].current_time);
    
    // Intentemos consultar las vacaciones
    console.log('Consultando tabla AnalystVacation...');
    const vacations = await prisma.analystVacation.findMany({
      take: 5
    });
    
    console.log(`Encontradas ${vacations.length} vacaciones:`);
    console.log(JSON.stringify(vacations, null, 2));
    
  } catch (error) {
    console.error('Error al conectar o consultar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
checkConnection()
  .catch(e => {
    console.error('Error inesperado:', e);
    process.exit(1);
  });
