'use client';

import { useTestCases } from '@/hooks/useTestCases';
import { useEffect } from 'react';

interface DebugTestCasesProps {
  projectId?: string;
}

export default function DebugTestCases({ projectId }: DebugTestCasesProps) {
  const { testCases, isLoading, isError } = useTestCases(projectId);
  
  useEffect(() => {
    console.log('Datos obtenidos del hook useTestCases:');
    console.log('testCases:', testCases);
    console.log('isLoading:', isLoading);
    console.log('isError:', isError);
    
    // Verificar los valores de testPlanId para detectar posibles problemas
    const uniquePlans = [...new Set(testCases.map(tc => tc.testPlanId))];
    console.log('Planes únicos encontrados en casos de prueba:', uniquePlans);
    
    // Contar casos por plan
    const casesByPlan = uniquePlans.reduce((acc, planId) => {
      if (planId) {
        acc[planId] = testCases.filter(tc => tc.testPlanId === planId).length;
      } else {
        acc['sin_plan'] = testCases.filter(tc => !tc.testPlanId).length;
      }
      return acc;
    }, {} as Record<string, number>);
    console.log('Casos por plan:', casesByPlan);
  }, [testCases, isLoading, isError]);
  
  return (
    <div className="p-4 bg-blue-50 rounded-md">
      <h2 className="text-lg font-bold">Depuración de Casos de Prueba</h2>
      <p className="text-sm">Abre la consola del navegador para ver la información de depuración.</p>
      <div className="mt-2">
        <p>Total de casos encontrados: {testCases.length}</p>
        <p>Estado de carga: {isLoading ? 'Cargando...' : 'Completado'}</p>
        <p>Error: {isError ? 'Sí hay errores' : 'No hay errores'}</p>
      </div>
      <div className="mt-4">
        <h3 className="text-md font-semibold">Datos brutos (primeros 3 casos):</h3>
        <pre className="bg-gray-100 p-2 mt-1 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(testCases.slice(0, 3), null, 2)}
        </pre>
      </div>
    </div>
  );
}
