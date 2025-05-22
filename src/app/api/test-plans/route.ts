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
    if (testPlanData.startDate) {
        // Comprobar si la fecha tiene formato ISO o solo YYYY-MM-DD
        if (testPlanData.startDate.includes('T')) {
            // Si es formato ISO, extraer solo la parte de la fecha
            testPlanData.startDate = testPlanData.startDate.split('T')[0];
        }
        // Validar el formato de fecha: YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(testPlanData.startDate)) {
            // Intentar convertir y formatear correctamente
            try {
                const date = new Date(testPlanData.startDate);
                testPlanData.startDate = `${date.getFullYear()}-${
                    (date.getMonth() + 1).toString().padStart(2, '0')}-${
                    date.getDate().toString().padStart(2, '0')}`;
            } catch (error) {
                console.error("Error formatting startDate:", error);
            }
        }
    }
    
    if (testPlanData.endDate) {
        // Comprobar si la fecha tiene formato ISO o solo YYYY-MM-DD
        if (testPlanData.endDate.includes('T')) {
            // Si es formato ISO, extraer solo la parte de la fecha
            testPlanData.endDate = testPlanData.endDate.split('T')[0];
        }
        // Validar el formato de fecha: YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(testPlanData.endDate)) {
            // Intentar convertir y formatear correctamente
            try {
                const date = new Date(testPlanData.endDate);
                testPlanData.endDate = `${date.getFullYear()}-${
                    (date.getMonth() + 1).toString().padStart(2, '0')}-${
                    date.getDate().toString().padStart(2, '0')}`;
            } catch (error) {
                console.error("Error formatting endDate:", error);
            }
        }
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
