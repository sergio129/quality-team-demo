import { NextResponse } from 'next/server';
import { metricasService } from '@/services/metricasService';

export async function GET() {
  try {
    const metricas = await metricasService.getMetricasConsolidadas();
    
    return NextResponse.json(metricas);
  } catch (error) {
    console.error('Error en API de métricas consolidadas:', error);
    return NextResponse.json(
      { error: 'Error obteniendo métricas consolidadas' },
      { status: 500 }
    );
  }
}
