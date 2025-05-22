import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const testPlanId = url.searchParams.get('testPlanId');
    
    if (projectId) {
        let testCases = await testCaseService.getTestCasesByProject(projectId);
        
        // Filtrar por plan de prueba si se proporciona
        if (testPlanId) {
            testCases = testCases.filter(tc => tc.testPlanId === testPlanId);
        }
        
        return NextResponse.json(testCases);
    } else {
        const testCases = await testCaseService.getAllTestCases();
        return NextResponse.json(testCases);
    }
}

export async function POST(req: NextRequest) {
    const testCaseData = await req.json();
    
    // Generar ID único si no se proporciona
    if (!testCaseData.id) {
        testCaseData.id = uuidv4();
    }
    
    // Generar código de referencia único si tiene un plan de pruebas o proyecto seleccionado
    if (testCaseData.codeRef) {
        // Si el código ya tiene un número al final, lo mantenemos
        if (!testCaseData.codeRef.match(/[0-9]+$/)) {
            // Si no tiene un número al final, generamos uno único
            const prefix = testCaseData.codeRef;
            testCaseData.codeRef = await testCaseService.generateUniqueCodeRef(prefix);
        }
    } else if (testCaseData.testPlanId) {
        // Si no hay un código de referencia pero hay un plan de pruebas
        const plans = await testCaseService.getAllTestPlans();
        const plan = plans.find(p => p.id === testCaseData.testPlanId);
        if (plan) {
            const prefix = `${plan.codeReference}-T`;
            testCaseData.codeRef = await testCaseService.generateUniqueCodeRef(prefix);
        }
    }
    
    // Añadir fechas
    const now = new Date().toISOString();
    testCaseData.createdAt = now;
    testCaseData.updatedAt = now;
    
    const success = await testCaseService.saveTestCase(testCaseData);
    
    if (success) {
        return NextResponse.json(testCaseData);
    }
    
    return NextResponse.json(
        { message: 'Error al crear el caso de prueba' },
        { status: 500 }
    );
}
