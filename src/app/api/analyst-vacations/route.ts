import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

// Handler para GET - Obtener todas las vacaciones o filtrar por analista
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const analystId = url.searchParams.get('analystId');
    
    let vacations;
    
    if (analystId) {
      // Filtrar por analista
      vacations = await prisma.analystVacation.findMany({
        where: { analystId }
      });
    } else {
      // Obtener todas las vacaciones
      vacations = await prisma.analystVacation.findMany();
    }
      // Convertir las fechas a objetos Date para mantener compatibilidad
    const formattedVacations = vacations.map((v: any) => ({
      ...v,
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate)
    }));
    
    return NextResponse.json(formattedVacations);
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
    // Crear el registro directamente con Prisma
    const newVacation = await prisma.analystVacation.create({
      data: {
        analystId: data.analystId,
        startDate: startDate,
        endDate: endDate,
        description: data.description || '',
        type: data.type
      }
    });
    
    // Convertir las fechas a objetos Date para mantener compatibilidad
    const formattedVacation = {
      ...newVacation,
      startDate: new Date(newVacation.startDate),
      endDate: new Date(newVacation.endDate)
    };
    
    return NextResponse.json(formattedVacation);
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
    // Eliminar directamente con Prisma
    await prisma.analystVacation.delete({
      where: { id: data.id }
    });
    
    // Responder con éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE de vacaciones:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
