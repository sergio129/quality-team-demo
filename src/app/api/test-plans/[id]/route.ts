import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const testPlan = await testCaseService.getTestPlan(params.id);
    
    if (testPlan) {
        return NextResponse.json(testPlan);
    }
    
    return NextResponse.json(
        { message: `No se encontró el plan de prueba con ID ${params.id}` },
        { status: 404 }
    );
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const testPlanData = await req.json();
    
    // Actualizar fecha de última modificación
    testPlanData.updatedAt = new Date().toISOString();
    
    const success = await testCaseService.updateTestPlan(params.id, testPlanData);
    
    if (success) {
        const updatedTestPlan = await testCaseService.getTestPlan(params.id);
        return NextResponse.json(updatedTestPlan);
    }
    
    return NextResponse.json(
        { message: `Error al actualizar el plan de prueba con ID ${params.id}` },
        { status: 500 }
    );
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const success = await testCaseService.deleteTestPlan(params.id);
    
    if (success) {
        return NextResponse.json({ message: 'Plan de prueba eliminado exitosamente' });
    }
    
    return NextResponse.json(
        { message: `Error al eliminar el plan de prueba con ID ${params.id}` },
        { status: 500 }
    );
}
