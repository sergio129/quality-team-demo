export interface TestStep {
  id: string;
  description: string;
  expected: string;
}

export interface TestEvidence {
  id: string;
  date: string;
  tester: string;
  precondition: string;
  steps: string[];
  screenshots: string[]; // URLs o rutas a las imágenes
  result: 'Exitoso' | 'Fallido' | 'No ejecutado';
  comments?: string;
}

export interface TestCycle {
  id: string;
  number: number;
  designed: number;
  successful: number;
  notExecuted: number;
  defects: number;
  startDate?: string;
  endDate?: string;
}

export interface TestCase {
  id: string;
  userStoryId: string; // HU
  name: string;
  projectId: string;
  codeRef: string; // Código de referencia (ej: HU1-T001)
  steps: TestStep[];
  expectedResult: string;
  testType: 'Funcional' | 'No Funcional' | 'Regresión' | 'Exploratoria' | 'Integración' | 'Rendimiento' | 'Seguridad';
  status: 'No ejecutado' | 'Exitoso' | 'Fallido' | 'Bloqueado' | 'En progreso';
  defects: string[]; // IDs de defectos relacionados
  evidences: TestEvidence[];
  cycle: number; // Número del ciclo actual
  category?: string;
  responsiblePerson?: string;
  priority?: 'Alta' | 'Media' | 'Baja';
  createdAt: string;
  updatedAt: string;
}

export interface TestPlan {
  id: string;
  projectId: string;
  projectName: string;
  codeReference: string; // SRCA-XXXX
  startDate: string;
  endDate: string;
  estimatedHours: number;
  estimatedDays: number;
  totalCases: number;
  cycles: TestCycle[];
  testQuality: number; // Porcentaje de calidad (0-100)
  createdAt: string;
  updatedAt: string;
}
