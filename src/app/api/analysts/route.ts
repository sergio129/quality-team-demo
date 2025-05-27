import { NextResponse } from 'next/server';
import { QAAnalystService } from '@/services/qaAnalystService';
import { QAAnalyst } from '@/models/QAAnalyst';

const analystService = new QAAnalystService();

export async function GET() {
    try {
        const analysts = await analystService.getAllAnalysts();
        return NextResponse.json(analysts);
    } catch (error) {
        return NextResponse.json({ error: 'Error getting analysts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const analyst: QAAnalyst = await request.json();
        const savedAnalyst = await analystService.saveAnalyst(analyst);
        if (!savedAnalyst) {
            return NextResponse.json({ error: 'Cell not found' }, { status: 404 });
        }
        return NextResponse.json(savedAnalyst);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating analyst' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...analyst }: QAAnalyst & { id: string } = await request.json();
        const updatedAnalyst = await analystService.updateAnalyst(id, analyst);
        if (!updatedAnalyst) {
            return NextResponse.json({ error: 'Analyst not found or invalid cell' }, { status: 404 });
        }
        return NextResponse.json(updatedAnalyst);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating analyst' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        
        console.log(`Intentando eliminar analista con ID: ${id}`);
        
        // Verificar primero si el analista existe
        const existingAnalyst = await analystService.getAnalystById(id);
        if (!existingAnalyst) {
            console.log(`Intento de eliminar analista inexistente con ID: ${id}`);
            return NextResponse.json({ 
                error: 'Analyst not found',
                details: `No se encontró un analista con ID: ${id}`
            }, { status: 404 });
        }
        
        console.log(`Eliminando analista: ${existingAnalyst.name} (${id})`);
        
        // Si existe, intentar eliminarlo
        const deleted = await analystService.deleteAnalyst(id);
        if (!deleted) {
            console.error(`No se pudo eliminar el analista ${existingAnalyst.name} (${id})`);
            return NextResponse.json({ 
                error: 'Failed to delete analyst',
                details: 'Posiblemente existen relaciones que no se pudieron manejar automáticamente'
            }, { status: 500 });
        }
        
        console.log(`✅ Analista eliminado con éxito: ${existingAnalyst.name} (${id})`);
        return NextResponse.json({ 
            success: true,
            message: `Analista "${existingAnalyst.name}" eliminado correctamente` 
        });
    } catch (error) {
        console.error('Error en DELETE /api/analysts:', error);
        return NextResponse.json({ 
            error: 'Error deleting analyst',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}
