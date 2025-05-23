// Script para corregir el estado de casos de prueba con defectos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirEstadosCasosDefectos() {
  console.log('=== CORRECCIÓN DE ESTADOS DE CASOS DE PRUEBA CON DEFECTOS ===\n');
  
  try {
    // 1. Obtener todos los casos de prueba con sus defectos relacionados
    const casosPrueba = await prisma.testCase.findMany({
      include: {
        defects: {
          include: {
            incident: true
          }
        }
      }
    });
    
    console.log(`Encontrados ${casosPrueba.length} casos de prueba en total.\n`);
    
    // 2. Filtrar los casos que tienen defectos pero su estado es "Exitoso" o nulo
    const casosACorregir = casosPrueba.filter(caso => 
      caso.defects && 
      caso.defects.length > 0 && 
      (caso.status === 'Exitoso' || !caso.status || caso.status === 'No ejecutado')
    );
    
    console.log(`Encontrados ${casosACorregir.length} casos de prueba con estado incorrecto para corregir:\n`);
    
    // 3. Actualizar cada caso con el estado correcto
    for (const caso of casosACorregir) {
      console.log(`Actualizando caso: ${caso.codeRef}`);
      console.log(`  - ID: ${caso.id}`);
      console.log(`  - Estado actual: ${caso.status || 'No definido'}`);
      console.log(`  - Número de defectos: ${caso.defects.length}`);
      
      // Mostrar los defectos asociados
      caso.defects.forEach(defect => {
        console.log(`    - Defecto: ${defect.incident.id} (${defect.incident.idJira}): ${defect.incident.estado}`);
      });
      
      // Cambiar el estado a "Fallido" si tiene defectos
      await prisma.testCase.update({
        where: { id: caso.id },
        data: {
          status: 'Fallido',
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✓ Estado actualizado a 'Fallido'\n`);
    }
    
    console.log(`Proceso completado. Se actualizaron ${casosACorregir.length} casos de prueba.`);
    
  } catch (error) {
    console.error('Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirEstadosCasosDefectos().catch(error => {
  console.error('Error al ejecutar la corrección:', error);
});
