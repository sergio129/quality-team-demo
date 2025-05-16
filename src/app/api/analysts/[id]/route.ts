import { NextResponse } from 'next/server';
import { QAAnalystService } from '@/services/qaAnalystService';

const analystService = new QAAnalystService();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Esperar el objeto params antes de acceder a sus propiedades
    const { id } = await params;
    
    const analyst = await analystService.getAnalystById(id);
    if (!analyst) {
      return NextResponse.json({ error: 'Analyst not found' }, { status: 404 });
    }
    
    return NextResponse.json(analyst);
  } catch (error) {
    return NextResponse.json({ error: 'Error getting analyst' }, { status: 500 });
  }
}
