// Script para establecer el estado correcto de los casos de prueba de SRCA-6556
const { PrismaClient } = require('@prisma/client');

async function corregirEstadosSRCA6556() {
  console.log('=== CORRECCIÓN DE ESTADOS DE CASOS SRCA-6556 ===\n');
  
  try {
    const prisma = new PrismaClient();
    console.log('Cliente Prisma inicializado.');
    
    // Obtener los casos de prueba del proyecto
    try {
      console.log('Intentando obtener casos de prueba...');
      const casosPrueba = await prisma.testCase.findMany({
        where: {
          projectId: 'SRCA-6556'
        },
        include: {
          defects: true
        }
      });
      
      console.log(`Encontrados ${casosPrueba.length} casos de prueba para el proyecto SRCA-6556.`);
      
      // Procesar cada caso y establecer el estado correcto
      for (const caso of casosPrueba) {
        console.log(`Caso: ${caso.codeRef}`);
        console.log(`  - Estado actual: ${caso.status || 'No definido'}`);
        console.log(`  - Defectos: ${caso.defects.length}`);
        
        try {
          // Si no tiene defectos y está en estado "Exitoso", cambiarlo a "No ejecutado"
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
        } catch (updateError) {
          console.error(`Error al actualizar caso ${caso.id}:`, updateError);
        }
        
        console.log();
      }
      
      // Verificar el resultado después de los cambios
      try {
        console.log('Verificando estado final...');
        const casosActualizados = await prisma.testCase.findMany({
          where: {
            projectId: 'SRCA-6556'
          }
        });
        
        console.log('Estado final de los casos:');
        for (const caso of casosActualizados) {
          console.log(`- ${caso.codeRef}: ${caso.status || 'No definido'}`);
        }
      } catch (verifyError) {
        console.error('Error al verificar estado final:', verifyError);
      }
    } catch (findError) {
      console.error('Error al buscar casos de prueba:', findError);
    }
    
    try {
      await prisma.$disconnect();
      console.log('Conexión de Prisma cerrada correctamente.');
    } catch (disconnectError) {
      console.error('Error al desconectar Prisma:', disconnectError);
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la corrección
corregirEstadosSRCA6556()
  .then(() => console.log('Proceso completado.'))
  .catch(error => console.error('Error al ejecutar la corrección:', error));
