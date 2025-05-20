import { NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

// Actualizar todos los planes de prueba y recalcular sus valores de calidad
export async function POST() {try {
    // Obtener todos los planes de prueba
    const testPlans = await testCaseService.getAllTestPlans();
    if (!testPlans || !Array.isArray(testPlans)) {
      return NextResponse.json({
        success: false,
        message: 'No se pudieron obtener los planes de prueba'
      }, { status: 500 });
    }
    
    const updatedPlans = [];
    
    // Procesar cada plan
    for (const plan of testPlans) {
      try {
        // Verificar que el plan es válido
        if (!plan || !plan.id || !plan.projectId) {
          console.error('Plan inválido:', plan);
          continue; // Saltar este plan
        }
        
        // Obtener casos de prueba asociados al plan
        const testCases = await testCaseService.getTestCasesByProject(plan.projectId);
        const casesForPlan = testCases.filter(tc => tc.testPlanId === plan.id);
      
      // Actualizar el contador de casos totales
      const totalCases = casesForPlan.length;
      
      // Calcular la calidad
      let testQuality = -1; // Valor predeterminado para "No aplicable"
      
      if (casesForPlan.length > 0) {
        const currentCycle = plan.cycles && plan.cycles.length > 0 
          ? plan.cycles[plan.cycles.length - 1] 
          : null;
        
        if (!currentCycle) {
          // Si no hay ciclo, no podemos calcular la calidad adecuadamente
          testQuality = -1;
          continue; // Pasar al siguiente plan
        }
        
        // Filtrar casos del último ciclo
        const casesInCurrentCycle = casesForPlan.filter(tc => tc.cycle === currentCycle.number);
        
        // Si no hay casos en el ciclo actual, usar todos los casos
        const casesToEvaluate = casesInCurrentCycle.length > 0 ? casesInCurrentCycle : casesForPlan;
        
        // 1. Cobertura de ejecución
        const executedCases = casesToEvaluate.filter(tc => tc.status !== 'No ejecutado').length;
        const coverageScore = (executedCases / casesToEvaluate.length) * 100;
        
        // 2. Eficacia
        const successfulCases = casesToEvaluate.filter(tc => tc.status === 'Exitoso').length;
        const effectivenessScore = executedCases > 0 
          ? (successfulCases / executedCases) * 100 
          : 0;
          // 3. Densidad de defectos
        const totalDefects = casesToEvaluate.reduce((sum, tc) => {
          // Asegurarse de que defects existe y es un array
          const defectsLength = tc.defects && Array.isArray(tc.defects) ? tc.defects.length : 0;
          return sum + defectsLength;
        }, 0);
        const defectDensity = totalDefects / casesToEvaluate.length;
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
        // Actualizar el plan de pruebas con los nuevos valores
      const updated = await testCaseService.updateTestPlan(plan.id, {
        totalCases,
        testQuality
      });
      
      if (updated) {
        updatedPlans.push({
          id: plan.id,
          projectId: plan.projectId,
          totalCases,
          testQuality: testQuality === -1 ? 'N/A' : testQuality
        });
      } else {
        console.error(`No se pudo actualizar el plan ${plan.id}`);
      }
      } catch (planError) {
        console.error(`Error al procesar el plan ${plan.id}:`, planError);
        // Continuar con el siguiente plan en lugar de fallar por completo
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Planes de prueba actualizados correctamente',
      updatedPlans
    });
  } catch (error) {
    console.error('Error al actualizar planes de prueba:', error);
    return NextResponse.json(
      { error: 'Error al actualizar planes de prueba' },
      { status: 500 }
    );
  }
}
