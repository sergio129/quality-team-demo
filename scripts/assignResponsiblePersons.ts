/**
 * Script para asignar masivamente persona responsable a los casos de prueba
 * existentes que no tienen asignación.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignResponsiblePersons() {
  console.log('=== ASIGNACIÓN MASIVA DE PERSONA RESPONSABLE ===\n');
  
  try {
    // Obtener la lista de analistas QA desde la base de datos
    const qaAnalysts = await prisma.qAAnalyst.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    if (qaAnalysts.length === 0) {
      console.log('No hay analistas QA en la base de datos para asignar como responsables.');
      return;
    }
    
    console.log(`Utilizando ${qaAnalysts.length} analistas QA para la asignación.`);
    
    // Obtener casos sin persona responsable
    const testCasesWithoutResponsible = await prisma.testCase.findMany({
      where: {
        OR: [
          { responsiblePerson: null },
          { responsiblePerson: '' },
          { responsiblePerson: '-' }
        ]
      },
      select: {
        id: true,
        projectId: true,
        name: true
      }
    });
    
    console.log(`Encontrados ${testCasesWithoutResponsible.length} casos sin persona responsable.`);
    
    if (testCasesWithoutResponsible.length === 0) {
      console.log('No hay casos para actualizar.');
      return;
    }
    
    // Agrupar por proyecto
    const casesByProject: Record<string, typeof testCasesWithoutResponsible> = {};
    
    testCasesWithoutResponsible.forEach(testCase => {
      if (!casesByProject[testCase.projectId]) {
        casesByProject[testCase.projectId] = [];
      }
      casesByProject[testCase.projectId].push(testCase);
    });
    
    // Para cada proyecto, asignar analista por lotes
    for (const [projectId, cases] of Object.entries(casesByProject)) {
      console.log(`\nProyecto ${projectId}: ${cases.length} caso(s)`);
        // Asignar un analista diferente a cada caso en el proyecto
      for (let i = 0; i < cases.length; i++) {
        const testCase = cases[i];
        // Seleccionar un analista de forma rotativa
        const selectedAnalyst = qaAnalysts[i % qaAnalysts.length];
        
        // Actualizar el caso
        await prisma.testCase.update({
          where: { id: testCase.id },
          data: {
            responsiblePerson: selectedAnalyst.name,
            updatedAt: new Date()
          }
        });
        
        console.log(`  - Caso ${testCase.name}: Asignado a ${selectedAnalyst.name}`);
      }
    }
    
    console.log('\nAsignación completada con éxito.');
  } catch (error) {
    console.error('Error al asignar persona responsable:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
assignResponsiblePersons()
  .catch(console.error);
