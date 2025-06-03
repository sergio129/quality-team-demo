import { NextResponse } from 'next/server';
import { metricasService } from '@/services/metricasService';

export async function GET() {
  try {
    const metricas = await metricasService.getCasosPruebaPorProyecto();
    
    return NextResponse.json(metricas);
  } catch (error) {
    console.error('Error en API de métricas de casos de prueba:', error);
    return NextResponse.json(
      { error: 'Error obteniendo métricas de casos de prueba' },
      { status: 500 }
    );
  }
}
