import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AnalystVacationService } from '@/services/analystVacationService';

// Crear una instancia del servicio directamente aquí para evitar problemas de importación
const vacationService = new AnalystVacationService();

// Handler para GET - Obtener todas las vacaciones o filtrar por analista
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const analystId = url.searchParams.get('analystId');
    
    let vacations;
    
    if (analystId) {
      vacations = await vacationService.getVacationsByAnalyst(analystId);
    } else {
      vacations = await vacationService.getAllVacations();
    }
    
    return NextResponse.json(vacations);
  } catch (error) {
    console.error('Error en GET de vacaciones:', error);
    return NextResponse.json({
      error: 'Error al obtener las vacaciones'
    }, { status: 500 });
  }
}

// Handler para POST - Crear un nuevo período de vacaciones
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validar datos
    if (!data.analystId || !data.startDate || !data.endDate || !data.type) {
      return NextResponse.json({
        error: 'Faltan campos obligatorios'
      }, { status: 400 });
    }
    
    // Crear objeto de vacaciones
    // Normalizar las fechas a medianoche UTC para evitar problemas de zona horaria
    const startDate = new Date(data.startDate);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(data.endDate);
    endDate.setUTCHours(0, 0, 0, 0);
    
    // Crear el registro usando el servicio de Prisma
    const newVacation = await analystVacationService.createVacation({
      analystId: data.analystId,
      startDate: startDate,
      endDate: endDate,
      description: data.description || '',
      type: data.type
    });
    
    return NextResponse.json(newVacation);
  } catch (error) {
    console.error('Error en POST de vacaciones:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Handler para DELETE - Eliminar un período de vacaciones
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json({
        error: 'Se requiere el ID de las vacaciones'
      }, { status: 400 });
    }
    
    // Eliminar usando el servicio Prisma
    await analystVacationService.deleteVacation(data.id);
    
    // Responder con éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE de vacaciones:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
