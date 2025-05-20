import { NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(request: Request) {
  try {
    // Extraer parámetros de la URL
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const cycle = searchParams.get('cycle') ? parseInt(searchParams.get('cycle') as string) : undefined;
    
    // Obtener estadísticas detalladas
    const stats = await testCaseService.getDetailedStats(projectId, cycle);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching test case statistics:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de casos de prueba' },
      { status: 500 }
    );
  }
}
