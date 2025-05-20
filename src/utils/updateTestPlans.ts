// Este script actualiza los planes de prueba existentes para corregir el contador de casos totales
// y recalcular la calidad utilizando los criterios correctos

import { testCaseService } from '../services/testCaseService';

async function updateTestPlans() {
  try {
    console.log('Iniciando actualización de planes de prueba...');
    
    // Obtener todos los planes de prueba
    const testPlans = await testCaseService.getTestPlans();
    console.log(`Encontrados ${testPlans.length} planes de prueba para actualizar`);
    
    // Procesar cada plan
    for (const plan of testPlans) {
      console.log(`Procesando plan ${plan.codeReference} (${plan.id})...`);
      
      // Obtener casos de prueba asociados al plan
      const testCases = await testCaseService.getTestCasesByProject(plan.projectId);
      const casesForPlan = testCases.filter(tc => tc.testPlanId === plan.id);
      
      // Actualizar el contador de casos totales
      const totalCases = casesForPlan.length;
      console.log(`  - Total de casos encontrados: ${totalCases}`);
      
      // Actualizar ciclos si es necesario
      if (plan.cycles && plan.cycles.length > 0) {
        // Actualizar el ciclo actual
        const currentCycle = plan.cycles[plan.cycles.length - 1];
        
        // Contar casos por estado para este ciclo
        const casesInCycle = casesForPlan.filter(tc => tc.cycle === currentCycle.number);
        const successfulCases = casesInCycle.filter(tc => tc.status === 'Exitoso').length;
        const notExecutedCases = casesInCycle.filter(tc => tc.status === 'No ejecutado').length;
        const totalDefects = casesInCycle.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
        
        // Actualizar estadísticas del ciclo
        currentCycle.designed = casesInCycle.length;
        currentCycle.successful = successfulCases;
        currentCycle.notExecuted = notExecutedCases;
        currentCycle.defects = totalDefects;
        
        console.log(`  - Ciclo ${currentCycle.number} actualizado: ${currentCycle.designed} diseñados, ${currentCycle.successful} exitosos, ${currentCycle.defects} defectos`);
      }
      
      // Calcular la calidad correctamente
      let testQuality = -1; // Valor predeterminado para "No aplicable"
      
      if (casesForPlan.length > 0) {
        // Usar el mismo algoritmo que en route.ts pero adaptado para este script
        const casesToEvaluate = casesForPlan;
        
        // 1. Cobertura de ejecución
        const executedCases = casesToEvaluate.filter(tc => tc.status !== 'No ejecutado').length;
        const coverageScore = casesToEvaluate.length > 0 
          ? (executedCases / casesToEvaluate.length) * 100 
          : 0;
        
        // 2. Eficacia
        const successfulCases = casesToEvaluate.filter(tc => tc.status === 'Exitoso').length;
        const effectivenessScore = executedCases > 0 
          ? (successfulCases / executedCases) * 100 
          : 0;
        
        // 3. Densidad de defectos
        const totalDefects = casesToEvaluate.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
        const defectDensity = casesToEvaluate.length > 0 
          ? totalDefects / casesToEvaluate.length 
          : 0;
        const defectScore = 100 * Math.exp(-defectDensity);
        
        // 4. Diversidad de tipos de prueba
        const uniqueTestTypes = new Set(casesToEvaluate.map(tc => tc.testType)).size;
        const testTypeScore = Math.min(uniqueTestTypes * 20, 100);
        
        // Ponderación de factores
        const weightCoverage = 0.35;
        const weightEffectiveness = 0.35;
        const weightDefects = 0.20;
        const weightTestTypes = 0.10;
        
        // Cálculo final
        testQuality = (
          (coverageScore * weightCoverage) +
          (effectivenessScore * weightEffectiveness) +
          (defectScore * weightDefects) +
          (testTypeScore * weightTestTypes)
        );
        
        // Redondear a 2 decimales
        testQuality = Math.round(testQuality * 100) / 100;
      }
      
      console.log(`  - Calidad recalculada: ${testQuality === -1 ? 'N/A' : `${testQuality}%`}`);
      
      // Actualizar el plan de pruebas
      await testCaseService.updateTestPlan(plan.id, {
        totalCases,
        cycles: plan.cycles,
        testQuality,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`  - Plan actualizado correctamente`);
    }
    
    console.log('Proceso de actualización completado con éxito');
  } catch (error) {
    console.error('Error al actualizar planes de prueba:', error);
  }
}

// Función para ejecutar el script
export async function runUpdateScript() {
  console.log('Iniciando script de actualización...');
  await updateTestPlans();
  console.log('Script finalizado');
  return { success: true, message: 'Planes de prueba actualizados correctamente' };
}
