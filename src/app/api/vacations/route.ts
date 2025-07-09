import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Instancia temporal de Prisma solo para este endpoint
const prisma = new PrismaClient();

// Handler para GET - Obtener todas las vacaciones directamente de la BD
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const analystId = url.searchParams.get('analystId');
  
  try {
    // Consulta directa a la base de datos
    const vacations = analystId 
      ? await prisma.analystVacation.findMany({ where: { analystId } })
      : await prisma.analystVacation.findMany();
    
    // Convertir fechas a objetos Date para mantener compatibilidad
    const formattedVacations = vacations.map(v => ({
      ...v,
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate)
    }));
    
    return NextResponse.json(formattedVacations);
  } catch (error) {
    console.error('Error al obtener vacaciones directamente de BD:', error);
    return NextResponse.json(
      { error: 'Error al obtener vacaciones', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handler para PUT - Actualizar una vacación existente
export async function PUT(request: NextRequest) {
  try {
    // Extraer el ID de la URL
    const id = request.url.split('/').pop() as string;
    const data = await request.json();
    
    // Validación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de vacación requerido' },
        { status: 400 }
      );
    }
    
    // Actualizar en la base de datos
    const updatedVacation = await prisma.analystVacation.update({
      where: { id },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        description: data.description,
        type: data.type
      },
    });
    
    return NextResponse.json(updatedVacation);
  } catch (error) {
    console.error('Error al actualizar vacación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la vacación', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handler para POST - Crear una nueva vacación
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validación de datos
    if (!data.analystId || !data.startDate || !data.endDate || !data.type) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios (analystId, startDate, endDate, type)' },
        { status: 400 }
      );
    }
    
    // Crear la vacación en la base de datos
    const newVacation = await prisma.analystVacation.create({
      data: {
        analystId: data.analystId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description || null,
        type: data.type
      }
    });
    
    return NextResponse.json(newVacation, { status: 201 });
  } catch (error) {
    console.error('Error al crear vacación:', error);
    return NextResponse.json(
      { error: 'Error al crear la vacación', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handler para DELETE - Eliminar una vacación
export async function DELETE(request: NextRequest) {
  try {
    // Extraer el ID de la URL
    const id = request.url.split('/').pop() as string;
    
    // Validación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de vacación requerido' },
        { status: 400 }
      );
    }
    
    // Eliminar de la base de datos
    await prisma.analystVacation.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Vacación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar vacación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la vacación', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
