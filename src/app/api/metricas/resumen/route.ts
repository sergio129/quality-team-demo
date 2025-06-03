import { NextResponse } from 'next/server';
import { metricasService } from '@/services/metricasService';

export async function GET() {
  try {
    const resumen = await metricasService.getResumenMetricas();
    
    return NextResponse.json(resumen);
  } catch (error) {
    console.error('Error en API de resumen de métricas:', error);
    return NextResponse.json(
      { error: 'Error obteniendo resumen de métricas' },
      { status: 500 }
    );
  }
}
