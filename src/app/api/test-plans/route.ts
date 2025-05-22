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
    
    // Asegurar que las fechas se formateen correctamente
    if (testPlanData.startDate && testPlanData.startDate.includes('T')) {
        testPlanData.startDate = testPlanData.startDate.split('T')[0];
    }
    
    if (testPlanData.endDate && testPlanData.endDate.includes('T')) {
        testPlanData.endDate = testPlanData.endDate.split('T')[0];
    }
    
    // Calcular días/horas si solo se proporcionó uno de los valores
    if (testPlanData.estimatedHours && (!testPlanData.estimatedDays || testPlanData.estimatedDays === 0)) {
        // 1 día = 9 horas de trabajo
        const hours = parseFloat(testPlanData.estimatedHours) || 0;
        testPlanData.estimatedDays = hours > 0 ? Math.round((hours / 9) * 10) / 10 : 0;
    } else if (testPlanData.estimatedDays && (!testPlanData.estimatedHours || testPlanData.estimatedHours === 0)) {
        // 1 día = 9 horas de trabajo
        const days = parseFloat(testPlanData.estimatedDays) || 0;
        testPlanData.estimatedHours = days > 0 ? Math.round(days * 9) : 0;
    }
    
    // Añadir fechas
    const now = new Date();
    testPlanData.createdAt = now.toISOString();
    testPlanData.updatedAt = now.toISOString();
    
    const success = await testCaseService.saveTestPlan(testPlanData);
    
    if (success) {
        return NextResponse.json(testPlanData);
    }
    
    return NextResponse.json(
        { message: 'Error al crear el plan de prueba' },
        { status: 500 }
    );
}
