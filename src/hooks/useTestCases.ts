'use client';

import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';
import { TestCase, TestPlan } from '@/models/TestCase';

// API endpoints
const TEST_CASES_API = '/api/test-cases';
const TEST_PLANS_API = '/api/test-plans';
const TEST_CASE_STATS_API = '/api/test-cases/stats';

/**
 * Hook para obtener casos de prueba
 */
export function useTestCases(projectId?: string, testPlanId?: string) {
  let endpoint = projectId ? `${TEST_CASES_API}?projectId=${projectId}` : TEST_CASES_API;
  if (testPlanId) {
    endpoint += `${endpoint.includes('?') ? '&' : '?'}testPlanId=${testPlanId}`;
  }
  
  // Configuración más agresiva para la revalidación de caché
  const { data, error, isLoading, mutate: refreshData } = useSWR<TestCase[]>(
    endpoint, 
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 2000 // Reducido para recargar más frecuentemente
    }
  );

  // Incluir una función para forzar refresco
  const forceRefresh = () => {
    refreshData();
  };

  return {
    testCases: data || [],
    isLoading,
    isError: error,
    refreshData: forceRefresh
  };
}

/**
 * Hook para obtener un caso de prueba específico
 */
export function useTestCase(id: string) {
  const { data, error, isLoading } = useSWR<TestCase>(id ? `${TEST_CASES_API}/${id}` : null, fetcher);

  return {
    testCase: data,
    isLoading,
    isError: error,
  };
}

/**
 * Hook para obtener planes de prueba
 */
export function useTestPlans(projectId?: string) {
  const endpoint = projectId ? `${TEST_PLANS_API}?projectId=${projectId}` : TEST_PLANS_API;
  const { data, error, isLoading } = useSWR<TestPlan[]>(endpoint, fetcher);

  return {
    testPlans: data || [],
    isLoading,
    isError: error,
  };
}

/**
 * Hook para obtener un plan de prueba específico
 */
export function useTestPlan(id: string) {
  const { data, error, isLoading } = useSWR<TestPlan>(id ? `${TEST_PLANS_API}/${id}` : null, fetcher);

  return {
    testPlan: data,
    isLoading,
    isError: error,
  };
}

/**
 * Hook para obtener estadísticas de casos de prueba por proyecto
 */
export function useTestCaseStats(projectId: string, testPlanId?: string) {
  const endpoint = projectId 
    ? `${TEST_CASE_STATS_API}?projectId=${projectId}${testPlanId ? `&testPlanId=${testPlanId}` : ''}`
    : null;
    
  const { data, error, isLoading } = useSWR<any>(endpoint, fetcher);

  return {
    stats: data || {
      totalCases: 0,
      statusStats: {},
      cycleStats: {}
    },
    isLoading,
    isError: error,
  };
}

/**
 * Función para crear un nuevo caso de prueba
 */
export async function createTestCase(testCase: Partial<TestCase>) {
  return toast.promise(
    async () => {
      const response = await fetch(TEST_CASES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el caso de prueba');
      }

      const newTestCase = await response.json();
      
      // Revalidar la caché
      mutate(TEST_CASES_API);
      if (testCase.projectId) {
        mutate(`${TEST_CASES_API}?projectId=${testCase.projectId}`);
        mutate(`${TEST_CASE_STATS_API}?projectId=${testCase.projectId}`);
      }
      
      return newTestCase;
    },
    {
      loading: 'Creando caso de prueba...',
      success: 'Caso de prueba creado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar un caso de prueba existente
 */
export async function updateTestCase(id: string, testCase: Partial<TestCase>) {
  return toast.promise(
    async () => {
      const response = await fetch(`${TEST_CASES_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el caso de prueba');
      }

      const updatedTestCase = await response.json();
      
      // Revalidar la caché
      mutate(TEST_CASES_API);
      mutate(`${TEST_CASES_API}/${id}`);
      if (testCase.projectId) {
        mutate(`${TEST_CASES_API}?projectId=${testCase.projectId}`);
        mutate(`${TEST_CASE_STATS_API}?projectId=${testCase.projectId}`);
      }
      
      return updatedTestCase;
    },
    {
      loading: 'Actualizando caso de prueba...',
      success: 'Caso de prueba actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para cambiar el estado de un caso de prueba
 */
export async function updateTestCaseStatus(id: string, status: string, projectId?: string) {
  return toast.promise(
    async () => {
      const response = await fetch(`${TEST_CASES_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al cambiar el estado del caso de prueba');
      }

      const updatedTestCase = await response.json();
      
      // Revalidar la caché
      mutate(TEST_CASES_API);
      mutate(`${TEST_CASES_API}/${id}`);
      if (projectId) {
        mutate(`${TEST_CASES_API}?projectId=${projectId}`);
        mutate(`${TEST_CASE_STATS_API}?projectId=${projectId}`);
      }
      
      return updatedTestCase;
    },
    {
      loading: 'Cambiando estado del caso de prueba...',
      success: 'Estado actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un caso de prueba
 */
export async function deleteTestCase(id: string, projectId?: string) {
  return toast.promise(
    async () => {
      const response = await fetch(`${TEST_CASES_API}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el caso de prueba');
      }
      
      // Revalidar la caché
      mutate(TEST_CASES_API);
      if (projectId) {
        mutate(`${TEST_CASES_API}?projectId=${projectId}`);
        mutate(`${TEST_CASE_STATS_API}?projectId=${projectId}`);
      }
      
      return true;
    },
    {
      loading: 'Eliminando caso de prueba...',
      success: 'Caso de prueba eliminado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para crear un nuevo plan de prueba
 */
export async function createTestPlan(testPlan: Partial<TestPlan>) {
  return toast.promise(
    async () => {
      const response = await fetch(TEST_PLANS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPlan),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el plan de prueba');
      }

      const newTestPlan = await response.json();
      
      // Revalidar la caché
      mutate(TEST_PLANS_API);
      if (testPlan.projectId) {
        mutate(`${TEST_PLANS_API}?projectId=${testPlan.projectId}`);
      }
      
      return newTestPlan;
    },
    {
      loading: 'Creando plan de prueba...',
      success: 'Plan de prueba creado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para actualizar un plan de prueba existente
 */
export async function updateTestPlan(id: string, testPlan: Partial<TestPlan>) {
  return toast.promise(
    async () => {
      const response = await fetch(`${TEST_PLANS_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPlan),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el plan de prueba');
      }

      const updatedTestPlan = await response.json();
      
      // Revalidar la caché
      mutate(TEST_PLANS_API);
      mutate(`${TEST_PLANS_API}/${id}`);
      if (testPlan.projectId) {
        mutate(`${TEST_PLANS_API}?projectId=${testPlan.projectId}`);
      }
      
      return updatedTestPlan;
    },
    {
      loading: 'Actualizando plan de prueba...',
      success: 'Plan de prueba actualizado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para eliminar un plan de prueba
 */
export async function deleteTestPlan(id: string, projectId?: string) {
  return toast.promise(
    async () => {
      const response = await fetch(`${TEST_PLANS_API}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al eliminar el plan de prueba');
      }
      
      // Revalidar la caché
      mutate(TEST_PLANS_API);
      if (projectId) {
        mutate(`${TEST_PLANS_API}?projectId=${projectId}`);
      }
      
      return true;
    },
    {
      loading: 'Eliminando plan de prueba...',
      success: 'Plan de prueba eliminado exitosamente',
      error: (err) => `Error: ${err.message}`
    }
  );
}

/**
 * Función para añadir evidencia a un caso de prueba
 */
export async function addTestEvidence(testCaseId: string, evidence: any) {
  return updateTestCase(testCaseId, {
    evidences: evidence
  });
}

/**
 * Función para cambiar el estado de un caso de prueba
 */
export async function changeTestCaseStatus(testCaseId: string, status: string) {
  return updateTestCase(testCaseId, {
    status: status as any
  });
}

/**
 * Hook para obtener estadísticas detalladas de los casos de prueba
 */
export function useDetailedTestCaseStats(projectId?: string, cycle?: number) {
  let endpoint = `${TEST_CASE_STATS_API}/detailed-stats`;
  
  if (projectId || cycle !== undefined) {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (cycle !== undefined) params.append('cycle', cycle.toString());
    endpoint += `?${params.toString()}`;
  }
  
  const { data, error, isLoading } = useSWR<any>(endpoint, fetcher);

  return {
    detailedStats: data || {
      total: 0,
      statusStats: {},
      typeStats: {},
      cycleProgress: [],
      userStoryStats: [],
      qualityTrend: [],
      defectsByCycle: []
    },
    isLoading,
    isError: error,
  };
}

/**
 * Función para calcular y actualizar automáticamente la calidad de un plan de pruebas
 */
export async function calculateTestPlanQuality(testPlanId: string) {
  try {
    const response = await fetch(`${TEST_PLANS_API}/calculate-quality?id=${testPlanId}`);
    
    if (!response.ok) {
      throw new Error('Error al calcular la calidad del plan de pruebas');
    }
    
    const data = await response.json();
    
    // Actualizar los datos en caché
    await mutate(
      TEST_PLANS_API,
      async (cachedData: TestPlan[] | undefined) => {
        if (!cachedData) return cachedData;
        
        return cachedData.map(plan => 
          plan.id === testPlanId
            ? { ...plan, testQuality: data.testQuality }
            : plan
        );
      },
      false
    );
    
    return data.testQuality;
  } catch (error) {
    console.error('Error calculating test plan quality:', error);
    throw error;
  }
}
