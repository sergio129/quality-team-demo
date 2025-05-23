/**
 * Script para restablecer algunos casos de prueba a "sin responsable asignado"
 * con el fin de probar la funcionalidad de asignación masiva.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSomeResponsiblePersons() {
  console.log('=== RESTABLECIMIENTO DE ALGUNOS CASOS A SIN RESPONSABLE ===\n');
  
  try {
    // Obtener todos los casos de prueba
    const testCases = await prisma.testCase.findMany({
      select: {
        id: true,
        name: true,
        projectId: true
      },
      take: 5 // Tomar solo 5 casos para restablecer
    });
    
    if (testCases.length === 0) {
      console.log('No se encontraron casos de prueba para restablecer.');
      return;
    }
    
    console.log(`Restableciendo ${testCases.length} casos de prueba a "sin responsable"...`);
    
    // Restablecer cada caso
    for (const testCase of testCases) {
      await prisma.testCase.update({
        where: { id: testCase.id },
        data: {
          responsiblePerson: null,
          updatedAt: new Date()
        }
      });
      
      console.log(`  - Caso ${testCase.name}: Responsable eliminado`);
    }
    
    console.log('\nRestablecimiento completado con éxito.');  } catch (error) {
    console.error('Error al restablecer personas responsables:', error);
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
resetSomeResponsiblePersons()
  .catch(console.error);
