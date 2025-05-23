// Script para establecer el estado correcto de los casos de prueba de SRCA-6556
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirEstadosSRCA6556() {
  console.log('=== CORRECCIÓN DE ESTADOS DE CASOS SRCA-6556 ===\n');
  
  try {
    // Obtener los casos de prueba del proyecto
    const casosPrueba = await prisma.testCase.findMany({
      where: {
        projectId: 'SRCA-6556'
      },
      include: {
        defects: true
      }
    });
    
    console.log(`Encontrados ${casosPrueba.length} casos de prueba para el proyecto SRCA-6556.\n`);
    
    // Procesar cada caso y establecer el estado correcto
    for (const caso of casosPrueba) {
      console.log(`Caso: ${caso.codeRef}`);
      console.log(`  - Estado actual: ${caso.status || 'No definido'}`);
      console.log(`  - Defectos: ${caso.defects.length}`);
      
      // Si no tiene defectos y está en estado "Exitoso", cambiarlo a "No ejecutado"
      // (a menos que el usuario haya marcado explícitamente como "Exitoso")
      if (caso.defects.length === 0 && caso.status === 'Exitoso') {
        await prisma.testCase.update({
          where: { id: caso.id },
          data: {
            status: 'No ejecutado',
            updatedAt: new Date()
          }
        });
        console.log(`  ✓ Estado cambiado a "No ejecutado"`);
      } else {
        console.log(`  ✓ No se requiere cambio de estado`);
      }
      
      console.log();
    }
    
    // Verificar el resultado después de los cambios
    const casosActualizados = await prisma.testCase.findMany({
      where: {
        projectId: 'SRCA-6556'
      }
    });
    
    console.log('Estado final de los casos:');
    for (const caso of casosActualizados) {
      console.log(`- ${caso.codeRef}: ${caso.status || 'No definido'}`);
    }
    
  } catch (error) {
    console.error('Error al corregir estados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirEstadosSRCA6556().catch(error => {
  console.error('Error al ejecutar la corrección:', error);
});
