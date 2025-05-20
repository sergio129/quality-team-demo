import { NextResponse } from 'next/server';
import { runUpdateScript } from '@/utils/updateTestPlans';

export async function POST(request: Request) {
  try {
    const result = await runUpdateScript();
    
    return NextResponse.json({
      success: true,
      message: 'Planes de prueba actualizados correctamente',
      result
    });
  } catch (error) {
    console.error('Error al sincronizar planes de prueba:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar los planes de prueba' },
      { status: 500 }
    );
  }
}
