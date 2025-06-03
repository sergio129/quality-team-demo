import { NextRequest, NextResponse } from 'next/server';
import { metricasService } from '@/services/metricasService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mesesAtras = parseInt(searchParams.get('meses') || '6');
    
    const metricas = await metricasService.getIncidentesPorMes(mesesAtras);
    
    return NextResponse.json(metricas);
  } catch (error) {
    console.error('Error en API de métricas de incidentes:', error);
    return NextResponse.json(
      { error: 'Error obteniendo métricas de incidentes' },
      { status: 500 }
    );
  }
}
