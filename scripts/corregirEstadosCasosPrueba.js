// Este script corrige los estados de los casos de prueba según los defectos asociados
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirEstadosCasosPrueba() {
  console.log('Iniciando corrección de estados de casos de prueba basados en defectos...');
  
  try {
    // Obtener todos los casos de prueba con sus defectos relacionados
    const testCases = await prisma.testCase.findMany({
      include: {
        defects: true
      }
    });
    
    console.log(`Encontrados ${testCases.length} casos de prueba para analizar.`);
    let actualizados = 0;
    
    // Procesar cada caso de prueba
    for (const testCase of testCases) {
      // Si tiene defectos pero su estado es null o "No ejecutado", cambiarlo a "Fallido"
      if (testCase.defects.length > 0 && (!testCase.status || testCase.status === 'No ejecutado')) {
        console.log(`Caso de prueba ${testCase.id} (${testCase.codeRef}): Cambiando estado de '${testCase.status || 'null'}' a 'Fallido' porque tiene ${testCase.defects.length} defecto(s) asociado(s).`);
        
        await prisma.testCase.update({
          where: { id: testCase.id },
          data: { 
            status: 'Fallido',
            updatedAt: new Date()
          }
        });
        
        actualizados++;
      }
      // Si no tiene estado definido, establecerlo como "No ejecutado"
      else if (!testCase.status) {
        console.log(`Caso de prueba ${testCase.id} (${testCase.codeRef}): Estableciendo estado por defecto 'No ejecutado'`);
        
        await prisma.testCase.update({
          where: { id: testCase.id },
          data: { 
            status: 'No ejecutado',
            updatedAt: new Date()
          }
        });
        
        actualizados++;
      }
    }
    
    console.log(`Proceso completado. Se actualizaron ${actualizados} casos de prueba.`);
  } catch (error) {
    console.error('Error al corregir estados de casos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirEstadosCasosPrueba();
