import { NextResponse } from 'next/server';
import { incidentService } from '@/services/incidentService';

export async function GET() {
    try {
        const stats = await incidentService.getStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas' },
            { status: 500 }
        );
    }
}
