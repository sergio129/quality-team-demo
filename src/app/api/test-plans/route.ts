import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    
    if (projectId) {
        const testPlans = await testCaseService.getTestPlansByProject(projectId);
        return NextResponse.json(testPlans);
    } else {
        const testPlans = await testCaseService.getAllTestPlans();
        return NextResponse.json(testPlans);
    }
}

export async function POST(req: NextRequest) {
    const testPlanData = await req.json();
    
    // Generar ID único si no se proporciona
    if (!testPlanData.id) {
        testPlanData.id = uuidv4();
    }
    
    // Añadir fechas
    const now = new Date().toISOString();
    testPlanData.createdAt = now;
    testPlanData.updatedAt = now;
    
    const success = await testCaseService.saveTestPlan(testPlanData);
    
    if (success) {
        return NextResponse.json(testPlanData);
    }
    
    return NextResponse.json(
        { message: 'Error al crear el plan de prueba' },
        { status: 500 }
    );
}
