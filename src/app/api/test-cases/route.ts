import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    
    if (projectId) {
        const testCases = await testCaseService.getTestCasesByProject(projectId);
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
