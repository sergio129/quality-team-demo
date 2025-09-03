import { NextResponse } from 'next/server';
import { AvailabilityCalculatorService } from '@/services/availabilityCalculatorService';

const availabilityService = new AvailabilityCalculatorService();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, analystId } = body;

    if (action === 'updateAll') {
      // Actualizar disponibilidad de todos los analistas
      await availabilityService.updateAllAnalystsAvailabilityInDatabase();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Disponibilidad actualizada para todos los analistas' 
      });

    } else if (action === 'updateOne' && analystId) {
      // Actualizar disponibilidad de un analista específico
      await availabilityService.updateAnalystAvailabilityInDatabase(analystId);
      
      return NextResponse.json({ 
        success: true, 
        message: `Disponibilidad actualizada para el analista ${analystId}` 
      });

    } else if (action === 'calculate' && analystId) {
      // Solo calcular sin actualizar en BD
      const availabilityData = await availabilityService.calculateAnalystAvailability(analystId);
      
      return NextResponse.json(availabilityData);

    } else if (action === 'calculateAll') {
      // Calcular disponibilidad de todos los analistas sin actualizar BD
      const availabilities = await availabilityService.calculateAllAnalystsAvailability();
      
      return NextResponse.json(availabilities);

    } else {
      return NextResponse.json(
        { error: 'Acción no válida. Use: updateAll, updateOne, calculate, o calculateAll' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error en API de disponibilidad:', error);
    return NextResponse.json(
      { 
        error: 'Error procesando solicitud de disponibilidad',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Calcular disponibilidad de todos los analistas
    const availabilities = await availabilityService.calculateAllAnalystsAvailability();
    return NextResponse.json(availabilities);

  } catch (error) {
    console.error('Error obteniendo disponibilidades:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo disponibilidades',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
