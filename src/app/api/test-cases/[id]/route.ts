import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const testCase = await testCaseService.getTestCase(params.id);
    
    if (testCase) {
        return NextResponse.json(testCase);
    }
    
    return NextResponse.json(
        { message: `No se encontró el caso de prueba con ID ${params.id}` },
        { status: 404 }
    );
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const testCaseData = await req.json();
    
    // Actualizar fecha de última modificación
    testCaseData.updatedAt = new Date().toISOString();
    
    const success = await testCaseService.updateTestCase(params.id, testCaseData);
    
    if (success) {
        const updatedTestCase = await testCaseService.getTestCase(params.id);
        return NextResponse.json(updatedTestCase);
    }
    
    return NextResponse.json(
        { message: `Error al actualizar el caso de prueba con ID ${params.id}` },
        { status: 500 }
    );
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const success = await testCaseService.deleteTestCase(params.id);
    
    if (success) {
        return NextResponse.json({ message: 'Caso de prueba eliminado exitosamente' });
    }
    
    return NextResponse.json(
        { message: `Error al eliminar el caso de prueba con ID ${params.id}` },
        { status: 500 }
    );
}
