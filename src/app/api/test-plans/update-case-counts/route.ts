import { NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(request: Request) {
  try {
    // Obtener todos los planes de prueba
    const testPlans = await testCaseService.getAllTestPlans();
    const updatedPlans = [];
    
    // Para cada plan, actualizar su contador de casos
    for (const plan of testPlans) {
      await testCaseService.updateTestPlanCaseCount(plan.projectId);
      updatedPlans.push(plan.projectId);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contadores de casos actualizados correctamente',
      updatedPlans
    });
  } catch (error) {
    console.error('Error al actualizar contadores de casos:', error);
    return NextResponse.json(
      { error: 'Error al actualizar contadores de casos' },
      { status: 500 }
    );
  }
}
