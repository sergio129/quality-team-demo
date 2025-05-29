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

// Handler para GET - Obtener todas las vacaciones directamente de la BD
export async function GET(req: NextRequest) {
  try {
    // Consulta directa a la base de datos
    const vacations = await prisma.analystVacation.findMany();
    
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
