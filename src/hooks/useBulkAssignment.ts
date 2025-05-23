import { toast } from 'sonner';
import { mutate } from 'swr';

const TEST_CASES_API = '/api/test-cases';
const TEST_CASE_BULK_ASSIGN_API = `${TEST_CASES_API}/bulk-assign`;

interface BulkAssignmentResult {
  updatedCount: number;
  total: number;
}

/**
 * Hook para manejar la asignación masiva de persona responsable
 */
export function useBulkAssignment() {
  /**
   * Asignar una persona responsable a múltiples casos de prueba por sus IDs
   */
  const assignResponsiblePersonByIds = async (
    testCaseIds: string[],
    responsiblePerson: string
  ): Promise<BulkAssignmentResult> => {
    return toast.promise(
      async () => {
        const response = await fetch(TEST_CASE_BULK_ASSIGN_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            responsiblePerson, 
            testCaseIds 
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Error al asignar persona responsable');
        }

        const result = await response.json();
        
        // Revalidar la caché para que los cambios se reflejen en la UI
        mutate(TEST_CASES_API);
        
        return result;
      },
      {
        loading: 'Asignando persona responsable...',
        success: (data) => `Se han asignado ${data.updated} caso(s) de prueba exitosamente`,
        error: (err) => `Error: ${err.message}`
      }
    );
  };

  /**
   * Asignar una persona responsable a casos de prueba que coincidan con los filtros
   */
  const assignResponsiblePersonByFilters = async (
    responsiblePerson: string,
    filters: { 
      projectId?: string; 
      testPlanId?: string; 
      status?: string; 
      cycle?: number;
      onlyNull?: boolean;
    }
  ): Promise<BulkAssignmentResult> => {
    return toast.promise(
      async () => {        // Validar que el projectId no esté vacío antes de hacer la llamada
        if (!filters.projectId) {
          throw new Error('Se debe proporcionar un proyecto para realizar la asignación masiva');
        }
        
        const response = await fetch(TEST_CASE_BULK_ASSIGN_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            responsiblePerson, 
            filters 
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Error al asignar persona responsable');
        }

        const result = await response.json();
        
        // Revalidar la caché para que los cambios se reflejen en la UI
        mutate(TEST_CASES_API);
        if (filters.projectId) {
          mutate(`${TEST_CASES_API}?projectId=${filters.projectId}`);
        }
        if (filters.projectId && filters.testPlanId) {
          mutate(`${TEST_CASES_API}?projectId=${filters.projectId}&testPlanId=${filters.testPlanId}`);
        }
        
        return result;
      },
      {
        loading: 'Asignando persona responsable...',
        success: (data) => `Se han asignado ${data.updated} caso(s) de prueba de un total de ${data.total}`,
        error: (err) => `Error: ${err.message}`
      }
    );
  };

  return {
    assignResponsiblePersonByIds,
    assignResponsiblePersonByFilters
  };
}
