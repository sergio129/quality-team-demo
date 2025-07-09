import { NextRequest, NextResponse } from 'next/server';
import { QAAnalystService } from '@/services/qaAnalystService';

const analystService = new QAAnalystService();

export async function GET(request: NextRequest) {
  try {
    // Extraer el ID de la URL en lugar de los parámetros
    const id = request.url.split('/').pop() as string;
    
    // Validación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de analista requerido' },
        { status: 400 }
      );
    }
    
    const analyst = await analystService.getAnalystById(id);
    if (!analyst) {
      return NextResponse.json({ error: 'Analyst not found' }, { status: 404 });
    }
    
    return NextResponse.json(analyst);
  } catch (error) {
    console.error('Error al obtener analista:', error);
    return NextResponse.json({ error: 'Error getting analyst' }, { status: 500 });
  }
}
