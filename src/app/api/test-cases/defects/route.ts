import { NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';
import { incidentService } from '@/services/incidentService';

export async function GET(request: Request) {
  try {
    // Extraer parámetros de la URL
    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get('testCaseId');
    
    if (!testCaseId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del caso de prueba' },
        { status: 400 }
      );
    }
    
    // Obtener el caso de prueba
    const testCase = await testCaseService.getTestCase(testCaseId);
    if (!testCase) {
      return NextResponse.json(
        { error: 'Caso de prueba no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el caso de prueba no tiene defectos, devolver un array vacío
    if (!testCase.defects || testCase.defects.length === 0) {
      return NextResponse.json([]);
    }
    
    // Obtener todos los incidentes
    const allIncidents = await incidentService.getAll();
    
    // Filtrar solo los incidentes que están vinculados al caso de prueba
    const linkedDefects = allIncidents.filter(incident => 
      testCase.defects.includes(incident.id)
    );
    
    return NextResponse.json(linkedDefects);
  } catch (error) {
    console.error('Error fetching test case defects:', error);
    return NextResponse.json(
      { error: 'Error al obtener los defectos vinculados al caso de prueba' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testCaseId, defectId } = body;
    
    if (!testCaseId || !defectId) {
      return NextResponse.json(
        { error: 'Se requieren los IDs del caso de prueba y del defecto' },
        { status: 400 }
      );
    }
    
    // Verificar que existe el caso de prueba
    const testCase = await testCaseService.getTestCase(testCaseId);
    if (!testCase) {
      return NextResponse.json(
        { error: 'Caso de prueba no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el defecto ya está vinculado
    const defects = testCase.defects || [];
    if (defects.includes(defectId)) {
      return NextResponse.json(
        { error: 'El defecto ya está vinculado a este caso de prueba' },
        { status: 400 }
      );
    }
    
    // Verificar que el defecto corresponda a este caso de prueba según su idJira
    const allIncidents = await incidentService.getAll();
    const defect = allIncidents.find(inc => inc.id === defectId);
    
    if (!defect) {
      return NextResponse.json(
        { error: 'Defecto no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el defecto tiene un idJira que parece ser un código de caso de prueba
    // (formato PROJ-####-T### o T###), verificar que corresponda a este caso
    if (defect.idJira && defect.idJira.includes('-T')) {
      // Verificar si el idJira coincide con este caso
      const codeMatch = 
        defect.idJira === testCase.codeRef ||
        defect.idJira === `${testCase.projectId}-${testCase.codeRef}` ||
        testCase.codeRef === defect.idJira.replace(/^.*-/, '');
      
      if (!codeMatch) {
        // Buscar el caso de prueba que debería recibir este defecto
        const allTestCases = await testCaseService.getAllTestCases();
        const correctTestCase = allTestCases.find(tc => 
          defect.idJira === tc.codeRef || 
          defect.idJira === `${tc.projectId}-${tc.codeRef}` ||
          tc.codeRef === defect.idJira.replace(/^.*-/, '')
        );
        
        if (correctTestCase) {
          return NextResponse.json(
            { 
              error: 'El defecto no corresponde a este caso de prueba según su idJira',
              suggestedTestCaseId: correctTestCase.id,
              suggestedTestCase: correctTestCase.name
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Actualizar el caso de prueba con el nuevo defecto
    const updatedDefects = [...defects, defectId];
    
    // Determinar el nuevo estado basado en el estado actual y la presencia de defectos
    let newStatus = testCase.status;
    // Si el estado es "Exitoso", "No ejecutado" o null, cambiarlo a "Fallido"
    if (!newStatus || newStatus === 'No ejecutado' || newStatus === 'Exitoso') {
      newStatus = 'Fallido';
    }
    
    const success = await testCaseService.updateTestCase(testCaseId, {
      defects: updatedDefects,
      status: newStatus
    });
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Defecto vinculado correctamente'
      });
    } else {
      return NextResponse.json(
        { error: 'Error al vincular el defecto al caso de prueba' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error linking defect to test case:', error);
    return NextResponse.json(
      { error: 'Error al vincular el defecto al caso de prueba' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraer parámetros de la URL
    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get('testCaseId');
    const defectId = searchParams.get('defectId');
    
    if (!testCaseId || !defectId) {
      return NextResponse.json(
        { error: 'Se requieren los IDs del caso de prueba y del defecto' },
        { status: 400 }
      );
    }
    
    // Verificar que existe el caso de prueba
    const testCase = await testCaseService.getTestCase(testCaseId);
    if (!testCase) {
      return NextResponse.json(
        { error: 'Caso de prueba no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el defecto está vinculado
    const defects = testCase.defects || [];
    if (!defects.includes(defectId)) {
      return NextResponse.json(
        { error: 'El defecto no está vinculado a este caso de prueba' },
        { status: 400 }
      );
    }
    
    // Actualizar el caso de prueba eliminando el defecto
    const updatedDefects = defects.filter(id => id !== defectId);
    const success = await testCaseService.updateTestCase(testCaseId, {
      defects: updatedDefects
    });
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Defecto desvinculado correctamente'
      });
    } else {
      return NextResponse.json(
        { error: 'Error al desvincular el defecto del caso de prueba' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error unlinking defect from test case:', error);
    return NextResponse.json(
      { error: 'Error al desvincular el defecto del caso de prueba' },
      { status: 500 }
    );
  }
}
