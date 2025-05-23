/**
 * Script para corregir los campos faltantes en los casos de prueba
 * 
 * Este script actualiza todos los casos de prueba para asegurar que tengan valores
 * predeterminados en campos como testType, priority, cycle y responsiblePerson
 * cuando estos valores son nulos.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTestCaseFields() {
  console.log('Iniciando corrección de campos faltantes en casos de prueba...');
  
  try {
    // Obtener todos los casos de prueba
    const testCases = await prisma.testCase.findMany();
    console.log(`Encontrados ${testCases.length} casos de prueba.`);
    
    // Contar casos con problemas
    const missingTestType = testCases.filter(tc => !tc.testType).length;
    const missingPriority = testCases.filter(tc => !tc.priority).length;
    const missingCycle = testCases.filter(tc => !tc.cycle).length;
    const missingResponsible = testCases.filter(tc => !tc.responsiblePerson).length;
    
    console.log(`Casos con testType faltante: ${missingTestType}`);
    console.log(`Casos con priority faltante: ${missingPriority}`);
    console.log(`Casos con cycle faltante: ${missingCycle}`);
    console.log(`Casos con responsiblePerson faltante: ${missingResponsible}`);
    
    // Actualizar los casos con valores faltantes
    const updatePromises = testCases.map(async (testCase) => {
      const updates: any = {};
      
      // Solo actualizar los campos que son nulos
      if (!testCase.testType) updates.testType = 'Funcional';
      if (!testCase.priority) updates.priority = 'Media';
      if (!testCase.cycle) updates.cycle = 1;
      if (!testCase.status) updates.status = 'No ejecutado';
      
      // Solo actualizar si hay algo que actualizar
      if (Object.keys(updates).length > 0) {
        return prisma.testCase.update({
          where: { id: testCase.id },
          data: updates
        });
      }
      
      return null;
    });
    
    // Ejecutar todas las actualizaciones
    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter(Boolean).length;
    
    console.log(`Se han actualizado ${updatedCount} casos de prueba.`);
    console.log('Proceso completado con éxito.');
    
  } catch (error) {
    console.error('Error al actualizar los casos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
fixTestCaseFields()
  .catch(console.error);
