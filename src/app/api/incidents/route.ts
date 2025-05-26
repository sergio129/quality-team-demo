import { NextResponse } from 'next/server';
import { incidentService } from '@/services/incidentService';

export async function GET() {
    try {
        const incidents = await incidentService.getAll();
        return NextResponse.json(incidents);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener incidencias' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const incident = await request.json();
        const newIncident = await incidentService.save(incident);
        return NextResponse.json(newIncident);
    } catch (error: any) {
        console.error('Error detallado al crear incidencia:', error);
        
        // Errores específicos que podemos manejar mejor
        if (error.message && error.message.includes('Analista no encontrado')) {
            return NextResponse.json({ 
                error: 'Error al crear incidencia: No se encontró el analista especificado',
                details: error.message 
            }, { status: 400 });
        }
        
        if (error.message && error.message.includes('Célula no encontrada')) {
            return NextResponse.json({ 
                error: 'Error al crear incidencia: No se encontró la célula especificada',
                details: error.message 
            }, { status: 400 });
        }
        
        // Error general
        return NextResponse.json({ 
            error: 'Error al crear incidencia',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, incident } = await request.json();
        const updatedIncident = await incidentService.update(id, incident);
        return NextResponse.json(updatedIncident);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar incidencia' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await incidentService.delete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar incidencia' }, { status: 500 });
    }
}
