import { NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(request: Request) {
  try {
    // Extraer parámetros de la URL
    const { searchParams } = new URL(request.url);
    const testPlanId = searchParams.get('id');
    
    if (!testPlanId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del plan de pruebas' },
        { status: 400 }
      );
    }
    
    // Obtener el plan de pruebas
    const testPlan = await testCaseService.getTestPlan(testPlanId);
    if (!testPlan) {
      return NextResponse.json(
        { error: 'Plan de pruebas no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener casos de prueba asociados al proyecto
    const testCases = await testCaseService.getTestCasesByProject(testPlan.projectId);
    
    // Calcular la calidad de pruebas
    const qualityScore = calculateTestQuality(testPlan, testCases);
    
    // Actualizar el plan de pruebas con el nuevo valor de calidad
    await testCaseService.updateTestPlan(testPlanId, {
      testQuality: qualityScore
    });
    
    return NextResponse.json({
      success: true,
      testPlanId,
      testQuality: qualityScore
    });
  } catch (error) {
    console.error('Error calculating test quality:', error);
    return NextResponse.json(
      { error: 'Error al calcular la calidad de las pruebas' },
      { status: 500 }
    );
  }
}

// Función para calcular la calidad de las pruebas
function calculateTestQuality(testPlan, testCases) {
  // Si no hay casos de prueba asociados, devolver -1 (que se interpretará como N/A en la interfaz)
  if (!testCases || testCases.length === 0) {
    return -1;
  }
  
  // Factores que afectan la calidad de las pruebas
  const currentCycle = testPlan.cycles[testPlan.cycles.length - 1];
  if (!currentCycle) return -1; // Si no hay ciclos, no podemos calcular
  
  // Filtrar casos del último ciclo
  const casesInCurrentCycle = testCases.filter(tc => tc.cycle === currentCycle.number);
  
  // Si no hay casos en el ciclo actual, usar todos los casos
  const casesToEvaluate = casesInCurrentCycle.length > 0 ? casesInCurrentCycle : testCases;
  
  // 1. Cobertura de ejecución: porcentaje de casos ejecutados vs. diseñados
  const executedCases = casesToEvaluate.filter(tc => tc.status !== 'No ejecutado').length;
  const coverageScore = casesToEvaluate.length > 0 
    ? (executedCases / casesToEvaluate.length) * 100 
    : 100;
  
  // 2. Eficacia: porcentaje de casos exitosos vs. ejecutados
  const successfulCases = casesToEvaluate.filter(tc => tc.status === 'Exitoso').length;
  const effectivenessScore = executedCases > 0 
    ? (successfulCases / executedCases) * 100 
    : 100;
  
  // 3. Densidad de defectos: defectos por caso de prueba (invertido)
  const totalDefects = casesToEvaluate.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
  const defectDensity = casesToEvaluate.length > 0 
    ? totalDefects / casesToEvaluate.length 
    : 0;
  // Convertir densidad de defectos a un puntaje (menor densidad = mayor puntaje)
  // Usar una función exponencial para penalizar más fuertemente densidades altas
  const defectScore = 100 * Math.exp(-defectDensity);
  
  // 4. Diversidad de tipos de prueba
  const uniqueTestTypes = new Set(casesToEvaluate.map(tc => tc.testType)).size;
  const testTypeScore = Math.min(uniqueTestTypes * 20, 100); // 20 puntos por cada tipo, máximo 100
  
  // Ponderación de factores
  const weightCoverage = 0.35; // 35%
  const weightEffectiveness = 0.35; // 35%
  const weightDefects = 0.20; // 20%
  const weightTestTypes = 0.10; // 10%
  
  // Cálculo del puntaje final de calidad
  const qualityScore = (
    (coverageScore * weightCoverage) +
    (effectivenessScore * weightEffectiveness) +
    (defectScore * weightDefects) +
    (testTypeScore * weightTestTypes)
  );
  
  // Redondear a 2 decimales
  return Math.round(qualityScore * 100) / 100;
}
