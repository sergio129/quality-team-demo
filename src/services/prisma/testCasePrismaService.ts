// testCasePrismaService.ts
import { TestCase, TestCycle } from '@/models/TestCase';
import { prisma } from '@/lib/prisma';

export default class TestCasePrismaService {
  // Obtener todos los casos de prueba
  async getAllTestCases(): Promise<TestCase[]> {
    try {
      const testCases = await prisma.testCase.findMany({
        include: {
          steps: true,
          evidences: true,
          defects: {
            include: {
              incident: true
            }
          }
        }
      });

      return testCases.map(tc => this.mapPrismaTestCaseToModel(tc));
    } catch (error) {
      console.error('Error getting all test cases:', error);
      return [];
    }
  }

  // Obtener casos de prueba por proyecto
  async getTestCasesByProject(projectId: string, testPlanId?: string): Promise<TestCase[]> {
    try {
      const testCases = await prisma.testCase.findMany({
        where: {
          projectId,
          ...(testPlanId && { testPlanId })
        },
        include: {
          steps: true,
          evidences: true,
          defects: {
            include: {
              incident: true
            }
          }
        }
      });

      return testCases.map(tc => this.mapPrismaTestCaseToModel(tc));
    } catch (error) {
      console.error(`Error getting test cases for project ${projectId}:`, error);
      return [];
    }
  }

  // Obtener un caso de prueba por ID
  async getTestCase(id: string): Promise<TestCase | null> {
    try {
      const testCase = await prisma.testCase.findUnique({
        where: { id },
        include: {
          steps: true,
          evidences: true,
          defects: {
            include: {
              incident: true
            }
          }
        }
      });

      return testCase ? this.mapPrismaTestCaseToModel(testCase) : null;
    } catch (error) {
      console.error(`Error getting test case ${id}:`, error);
      return null;
    }
  }

  // Guardar un nuevo caso de prueba
  async saveTestCase(testCase: TestCase): Promise<boolean> {
    try {
      const { steps, evidences, defects, ...testCaseData } = testCase;

      const createdTestCase = await prisma.testCase.create({
        data: {
          ...testCaseData,
          steps: {
            create: steps.map(step => ({
              ...step
            }))
          },
          evidences: {
            create: evidences?.map(evidence => ({
              ...evidence,
              date: new Date(evidence.date)
            })) || []
          },
          defects: {
            create: defects?.map(defectId => ({
              incident: {
                connect: { id: defectId }
              }
            })) || []
          }
        }
      });

      return !!createdTestCase;
    } catch (error) {
      console.error('Error saving test case:', error);
      return false;
    }
  }

  // Actualizar un caso de prueba existente
  async updateTestCase(id: string, updatedTestCase: Partial<TestCase>): Promise<boolean> {
    try {
      const { steps, evidences, defects, ...testCaseData } = updatedTestCase;

      // Actualizar el caso de prueba principal
      await prisma.testCase.update({
        where: { id },
        data: {
          ...testCaseData,
          updatedAt: new Date()
        }
      });

      // Si hay pasos nuevos, actualizar
      if (steps) {
        // Eliminar pasos existentes
        await prisma.testStep.deleteMany({
          where: { testCaseId: id }
        });

        // Crear nuevos pasos
        await prisma.testStep.createMany({
          data: steps.map(step => ({
            ...step,
            testCaseId: id
          }))
        });
      }

      // Si hay evidencias nuevas, actualizar
      if (evidences) {
        await prisma.testEvidence.deleteMany({
          where: { testCaseId: id }
        });

        await prisma.testEvidence.createMany({
          data: evidences.map(evidence => ({
            ...evidence,
            date: new Date(evidence.date),
            testCaseId: id
          }))
        });
      }

      // Si hay defectos nuevos, actualizar
      if (defects) {
        await prisma.defectRelation.deleteMany({
          where: { testCaseId: id }
        });

        await prisma.defectRelation.createMany({
          data: defects.map(defectId => ({
            testCaseId: id,
            incidentId: defectId
          }))
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating test case ${id}:`, error);
      return false;
    }
  }

  // Eliminar un caso de prueba
  async deleteTestCase(id: string): Promise<boolean> {
    try {
      await prisma.testCase.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error(`Error deleting test case ${id}:`, error);
      return false;
    }
  }
  
  // Actualizar la persona responsable de múltiples casos de prueba por IDs
  async bulkUpdateResponsiblePerson(testCaseIds: string[], responsiblePerson: string): Promise<{updatedCount: number}> {
    try {
      const result = await prisma.testCase.updateMany({
        where: {
          id: {
            in: testCaseIds
          }
        },
        data: {
          responsiblePerson,
          updatedAt: new Date()
        }
      });

      return { updatedCount: result.count };
    } catch (error) {
      console.error(`Error updating responsible person for multiple test cases:`, error);
      return { updatedCount: 0 };
    }
  }
  
  // Actualizar la persona responsable de múltiples casos de prueba usando filtros
  async bulkUpdateResponsiblePersonByFilters(
    responsiblePerson: string,
    filters: { projectId?: string; testPlanId?: string; status?: string; cycle?: number; onlyNull?: boolean }
  ): Promise<{updatedCount: number; totalFiltered: number}> {
    try {
      // Construir el filtro donde
      const where: any = {};
      
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      
      if (filters.testPlanId) {
        where.testPlanId = filters.testPlanId;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.cycle) {
        where.cycle = filters.cycle;
      }
        // Si onlyNull es true, solo actualizar casos que tengan responsiblePerson nulo o vacío
      if (filters.onlyNull) {
        where.OR = [
          { responsiblePerson: null },
          { responsiblePerson: '' },
          { responsiblePerson: '-' }
        ];
      }
      
      // Primero, contar cuántos casos coinciden con los filtros
      const totalFiltered = await prisma.testCase.count({ where });
      
      // Luego realizar la actualización
      const result = await prisma.testCase.updateMany({
        where,
        data: {
          responsiblePerson,
          updatedAt: new Date()
        }
      });
      
      return { 
        updatedCount: result.count,
        totalFiltered
      };
    } catch (error) {
      console.error(`Error updating responsible person with filters:`, error);
      return { updatedCount: 0, totalFiltered: 0 };
    }
  }

  // Obtener estadísticas de casos de prueba por proyecto
  async getTestCaseStatsByProject(projectId: string, testPlanId?: string): Promise<any> {
    try {
      const testCases = await this.getTestCasesByProject(projectId, testPlanId);
      
      if (!testCases.length) {
        return {
          totalCases: 0,
          cycleStats: {},
          statsByType: {},
          statsByStatus: {},
          defectsTotal: 0,
        };
      }

      const cycleStats: Record<number, {
        designed: number;
        successful: number;
        notExecuted: number;
        defects: number;
      }> = {};
      const statsByType: Record<string, number> = {};
      const statsByStatus = {
        'No ejecutado': 0,
        'Exitoso': 0,
        'Fallido': 0,
        'Bloqueado': 0,
        'En progreso': 0
      };
      let defectsTotal = 0;

      testCases.forEach(tc => {
        // Estadísticas por ciclo
        if (tc.cycle) {
          if (!cycleStats[tc.cycle]) {
            cycleStats[tc.cycle] = {
              designed: 0,
              successful: 0,
              notExecuted: 0,
              defects: 0
            };
          }
          cycleStats[tc.cycle].designed++;
          
          if (tc.status === 'Exitoso') {
            cycleStats[tc.cycle].successful++;
          } else if (tc.status === 'No ejecutado') {
            cycleStats[tc.cycle].notExecuted++;
          }
          
          if (tc.defects && tc.defects.length > 0) {
            cycleStats[tc.cycle].defects += tc.defects.length;
            defectsTotal += tc.defects.length;
          }
        }

        // Estadísticas por tipo
        if (tc.testType) {
          if (!statsByType[tc.testType]) {
            statsByType[tc.testType] = 0;
          }
          statsByType[tc.testType]++;
        }

        // Estadísticas por estado
        if (tc.status) {
          statsByStatus[tc.status]++;
        }
      });

      return {
        totalCases: testCases.length,
        cycleStats,
        statsByType,
        statsByStatus,
        defectsTotal,
      };
    } catch (error) {
      console.error(`Error getting test case stats for project ${projectId}:`, error);
      return null;
    }
  }

  // Método privado para mapear un caso de prueba de Prisma a nuestro modelo
  private mapPrismaTestCaseToModel(prismaTestCase: any): TestCase {
    const { steps, evidences, defects, ...testCaseData } = prismaTestCase;
    
    // Calcular el estado correcto basado en defectos
    let status = testCaseData.status;
    const defectsIds = defects.map((defect: any) => defect.incident.id);
    
    // Si hay defectos y el estado es null o "No ejecutado", marcarlo como fallido
    if (defectsIds.length > 0 && (!status || status === 'No ejecutado')) {
      status = 'Fallido';
    }
    
    // Si no tiene estado, por defecto "No ejecutado"
    if (!status) {
      status = 'No ejecutado';
    }    return {
      ...testCaseData,
      status,
      // Asegurar valores predeterminados para campos opcionales
      testType: testCaseData.testType || 'Funcional',
      cycle: testCaseData.cycle || 1,
      priority: testCaseData.priority || 'Media',
      responsiblePerson: testCaseData.responsiblePerson || '-',
      steps: steps.map((step: any) => ({
        id: step.id,
        description: step.description,
        expected: step.expected || ''
      })),
      evidences: evidences.map((evidence: any) => ({
        id: evidence.id,
        date: evidence.date.toISOString(),
        tester: evidence.tester,
        precondition: evidence.precondition || '',
        result: evidence.result,
        comments: evidence.comments || '',
        steps: evidence.steps || [],
        screenshots: evidence.screenshots || []
      })),
      defects: defectsIds,
      createdAt: testCaseData.createdAt.toISOString(),
      updatedAt: testCaseData.updatedAt.toISOString()
    };
  }
}
