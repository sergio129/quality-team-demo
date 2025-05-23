import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

/**
 * Endpoint para asignar masivamente una persona responsable a múltiples casos de prueba
 */
export async function POST(req: NextRequest) {
    try {
        const { responsiblePerson, testCaseIds, filters } = await req.json();
        
        // Validar que se proporcione la persona responsable
        if (!responsiblePerson) {
            return NextResponse.json(
                { error: 'Se debe proporcionar una persona responsable' },
                { status: 400 }
            );
        }
        
        // Si se proporcionan IDs específicos, asignar solo a esos casos
        if (testCaseIds && Array.isArray(testCaseIds) && testCaseIds.length > 0) {
            const result = await testCaseService.bulkUpdateResponsiblePerson(testCaseIds, responsiblePerson);
            
            return NextResponse.json({
                message: 'Asignación masiva completada',
                updated: result.updatedCount,
                total: testCaseIds.length
            });
        }        // Si se proporcionan filtros, aplicar a los casos que cumplan los criterios
        else if (filters) {
            const { projectId, testPlanId, status, cycle, onlyNull } = filters;
            
            if (!projectId) {
                return NextResponse.json(
                    { error: 'Se debe proporcionar al menos un projectId en los filtros' },
                    { status: 400 }
                );
            }
            
            const result = await testCaseService.bulkUpdateResponsiblePersonByFilters(
                responsiblePerson,
                { projectId, testPlanId, status, cycle, onlyNull }
            );
            
            return NextResponse.json({
                message: 'Asignación masiva completada',
                updated: result.updatedCount,
                total: result.totalFiltered
            });
        }
        else {
            return NextResponse.json(
                { error: 'Se debe proporcionar una lista de IDs o filtros para la asignación' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error en la asignación masiva:', error);
        return NextResponse.json(
            { error: 'Error al realizar la asignación masiva' },
            { status: 500 }
        );
    }
}
