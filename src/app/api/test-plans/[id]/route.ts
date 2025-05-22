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
    
    // Asegurar que las fechas se guarden correctamente sin ajustes de zona horaria
    if (testPlanData.startDate) {
        // Comprobar si la fecha tiene formato ISO o solo YYYY-MM-DD
        if (testPlanData.startDate.includes('T')) {
            // Si es formato ISO, extraer solo la parte de la fecha
            testPlanData.startDate = testPlanData.startDate.split('T')[0];
        }
    }
    
    if (testPlanData.endDate) {
        // Comprobar si la fecha tiene formato ISO o solo YYYY-MM-DD
        if (testPlanData.endDate.includes('T')) {
            // Si es formato ISO, extraer solo la parte de la fecha
            testPlanData.endDate = testPlanData.endDate.split('T')[0];
        }
    }
    
    // Recalcular días si las horas cambiaron
    if (testPlanData.estimatedHours !== undefined && 
        (!testPlanData.estimatedDays || testPlanData.estimatedDays === 0)) {
        // 1 día = 9 horas de trabajo
        const hours = parseFloat(testPlanData.estimatedHours) || 0;
        testPlanData.estimatedDays = hours > 0 ? Math.round((hours / 9) * 10) / 10 : 0;
    }
    
    // Recalcular horas si los días cambiaron
    if (testPlanData.estimatedDays !== undefined && 
        (!testPlanData.estimatedHours || testPlanData.estimatedHours === 0)) {
        // 1 día = 9 horas de trabajo
        const days = parseFloat(testPlanData.estimatedDays) || 0;
        testPlanData.estimatedHours = days > 0 ? Math.round(days * 9) : 0;
    }
    
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
