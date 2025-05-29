// Script para consultar directamente la tabla AnalystVacation en PostgreSQL
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Consultando directamente la tabla AnalystVacation en PostgreSQL...');
  
  const prisma = new PrismaClient();
  
  try {
    // Consultar todos los registros
    const vacations = await prisma.analystVacation.findMany();
    
    console.log(`Encontrados ${vacations.length} registros de vacaciones.`);
    
    if (vacations.length > 0) {
      console.log('\nRegistros encontrados:');
      vacations.forEach((v, index) => {
        console.log(`\n--- Registro ${index + 1} ---`);
        console.log(`ID: ${v.id}`);
        console.log(`Analista ID: ${v.analystId}`);
        console.log(`Tipo: ${v.type}`);
        console.log(`Fecha inicio: ${v.startDate}`);
        console.log(`Fecha fin: ${v.endDate}`);
        console.log(`Descripción: ${v.description || 'N/A'}`);
        console.log(`Creado: ${v.createdAt}`);
        console.log(`Actualizado: ${v.updatedAt}`);
      });

      // Ahora vamos a buscar el analista correspondiente
      if (vacations[0].analystId) {
        const analyst = await prisma.qAAnalyst.findUnique({
          where: { id: vacations[0].analystId }
        });
        
        if (analyst) {
          console.log('\nInformación del analista para el primer registro:');
          console.log(`Nombre: ${analyst.name}`);
          console.log(`Email: ${analyst.email}`);
        } else {
          console.log('\nNo se encontró información del analista para el ID:', vacations[0].analystId);
        }
      }
    } else {
      console.log('No se encontraron registros de vacaciones.');
    }
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
