import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(req: NextRequest) {
    try {
        // Extraer el ID de la URL en lugar de los parámetros
        const id = req.url.split('/').pop() as string;
        
        // Validación
        if (!id) {
            return NextResponse.json(
                { error: 'ID del caso de prueba requerido' },
                { status: 400 }
            );
        }
        
        const testCase = await testCaseService.getTestCase(id);
        
        if (testCase) {
            return NextResponse.json(testCase);
        }
        
        return NextResponse.json(
            { message: `No se encontró el caso de prueba con ID ${id}` },
            { status: 404 }
        );
    } catch (error) {
        console.error('Error al obtener caso de prueba:', error);
        return NextResponse.json(
            { error: 'Error al obtener el caso de prueba' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Extraer el ID de la URL en lugar de los parámetros
        const id = req.url.split('/').pop() as string;
        const testCaseData = await req.json();
        
        // Validación
        if (!id) {
            return NextResponse.json(
                { error: 'ID del caso de prueba requerido' },
                { status: 400 }
            );
        }
        
        // Actualizar fecha de última modificación
        testCaseData.updatedAt = new Date().toISOString();
        
        const success = await testCaseService.updateTestCase(id, testCaseData);
        
        if (success) {
            const updatedTestCase = await testCaseService.getTestCase(id);
            return NextResponse.json(updatedTestCase);
        }
        
        return NextResponse.json(
            { message: `Error al actualizar el caso de prueba con ID ${id}` },
            { status: 500 }
        );
    } catch (error) {
        console.error('Error al actualizar caso de prueba:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el caso de prueba' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Extraer el ID de la URL en lugar de los parámetros
        const id = req.url.split('/').pop() as string;
        
        // Validación
        if (!id) {
            return NextResponse.json(
                { error: 'ID del caso de prueba requerido' },
                { status: 400 }
            );
        }
        
        const success = await testCaseService.deleteTestCase(id);
        
        if (success) {
            return NextResponse.json({ message: 'Caso de prueba eliminado exitosamente' });
        }
        
        return NextResponse.json(
            { message: `Error al eliminar el caso de prueba con ID ${id}` },
            { status: 500 }
        );
    } catch (error) {
        console.error('Error al eliminar caso de prueba:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el caso de prueba' },
            { status: 500 }
        );
    }
}
