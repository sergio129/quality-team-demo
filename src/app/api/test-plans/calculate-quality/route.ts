import { NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';
import { TestCase, TestPlan } from '@/models/TestCase';

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
function calculateTestQuality(testPlan: TestPlan, testCases: TestCase[]) {
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

  // NUEVO MÉTODO DE CÁLCULO DE CALIDAD
  // Contar el total de defectos
  const totalDefects = casesToEvaluate.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
  const totalCasosDisenados = casesToEvaluate.length;
  
  // Si no hay casos diseñados, devolver 100 (calidad perfecta)
  if (totalCasosDisenados === 0) {
    return 100;
  }
  
  // Si no hay defectos, la calidad es 100%
  if (totalDefects === 0) {
    return 100;
  }
  
  // Aplicar la fórmula: Calidad = 100 - (totalDefectos / totalCasosDisenados) * 100
  const qualityScore = 100 - (totalDefects / totalCasosDisenados) * 100;
  
  // Asegurarse de que la calidad no sea un número negativo
  const finalScore = Math.max(0, qualityScore);
  
  // Redondear a 2 decimales
  return Math.round(finalScore * 100) / 100;
}
