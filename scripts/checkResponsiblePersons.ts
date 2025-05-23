/**
 * Script para verificar y reportar el estado de asignación de persona responsable
 * en los casos de prueba.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkResponsiblePersonAssignment() {
  console.log('=== VERIFICACIÓN DE ASIGNACIÓN DE PERSONA RESPONSABLE ===\n');
  
  try {
    // Obtener todos los casos de prueba
    const allTestCases = await prisma.testCase.count();
    
    // Contar casos sin persona responsable asignada
    const casesWithoutResponsible = await prisma.testCase.count({
      where: {
        OR: [
          { responsiblePerson: null },
          { responsiblePerson: '' },
          { responsiblePerson: '-' }
        ]
      }
    });
    
    console.log(`Total de casos de prueba: ${allTestCases}`);
    console.log(`Casos sin persona responsable: ${casesWithoutResponsible} (${Math.round(casesWithoutResponsible / allTestCases * 100)}%)`);
    
    // Obtener estadísticas por proyecto
    const projectStats = await prisma.testCase.groupBy({
      by: ['projectId'],
      _count: {
        id: true
      },
    });
    
    console.log('\n=== ESTADÍSTICAS POR PROYECTO ===\n');
    
    for (const projectStat of projectStats) {
      const { projectId } = projectStat;
      
      // Obtener el número de casos por proyecto
      const totalCasesInProject = projectStat._count.id;
      
      // Obtener casos sin responsable en este proyecto
      const withoutResponsibleInProject = await prisma.testCase.count({
        where: {
          projectId,
          OR: [
            { responsiblePerson: null },
            { responsiblePerson: '' },
            { responsiblePerson: '-' }
          ]
        }
      });
      
      const percentage = Math.round(withoutResponsibleInProject / totalCasesInProject * 100);
      
      console.log(`Proyecto ${projectId}:`);
      console.log(`  - Total casos: ${totalCasesInProject}`);
      console.log(`  - Sin responsable: ${withoutResponsibleInProject} (${percentage}%)\n`);
    }
  } catch (error) {
    console.error('Error al verificar asignación de persona responsable:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
checkResponsiblePersonAssignment()
  .catch(console.error);
