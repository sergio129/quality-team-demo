import { TestCase, TestPlan } from '@/models/TestCase';
import { migrationConfig } from '@/config/migration';
import TestCaseFileService from './file/testCaseFileService';
import TestCasePrismaService from './prisma/testCasePrismaService';
import TestPlanFileService from './file/testPlanFileService';
import TestPlanPrismaService from './prisma/testPlanPrismaService';

// Crear una instancia de cada servicio
const testCaseFileService = new TestCaseFileService();
const testCasePrismaService = new TestCasePrismaService();
const testPlanFileService = new TestPlanFileService();
const testPlanPrismaService = new TestPlanPrismaService();

// Función para determinar qué servicio usar para casos de prueba
function getTestCaseService() {
  return migrationConfig.services.testCases ? testCasePrismaService : testCaseFileService;
}

// Función para determinar qué servicio usar para planes de prueba
function getTestPlanService() {
  return migrationConfig.services.testPlans ? testPlanPrismaService : testPlanFileService;
}

export const testCaseService = {
  async getAllTestCases(): Promise<TestCase[]> {
    try {
      return getTestCaseService().getAllTestCases();
    } catch (error) {
      console.error('Error reading test cases:', error);
      return [];
    }
  },

  async getTestCasesByProject(projectId: string): Promise<TestCase[]> {
    try {
      return getTestCaseService().getTestCasesByProject(projectId);
    } catch (error) {
      console.error(`Error getting test cases for project ${projectId}:`, error);
      return [];
    }
  },

  async getTestCase(id: string): Promise<TestCase | null> {
    try {
      return getTestCaseService().getTestCase(id);
    } catch (error) {
      console.error(`Error getting test case ${id}:`, error);
      return null;
    }
  },

  async saveTestCase(testCase: TestCase): Promise<boolean> {
    try {
      const result = await getTestCaseService().saveTestCase(testCase);
      
      // Si el caso tiene un plan de pruebas asociado, actualizar su contador
      if (testCase.testPlanId) {
        const testPlan = await this.getTestPlan(testCase.testPlanId);
        if (testPlan && testPlan.projectId) {
          await this.updateTestPlanCaseCount(testPlan.projectId);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving test case:', error);
      return false;
    }
  },

  async updateTestCase(id: string, updatedTestCase: Partial<TestCase>): Promise<boolean> {
    try {
      // Obtener el caso de prueba original para verificar cambios en testPlanId
      const originalTestCase = await this.getTestCase(id);
      const originalTestPlanId = originalTestCase?.testPlanId;
      const newTestPlanId = updatedTestCase.testPlanId;
      
      const result = await getTestCaseService().updateTestCase(id, updatedTestCase);
      
      // Si cambió el plan de pruebas, actualizar ambos planes
      if (originalTestPlanId && (!newTestPlanId || originalTestPlanId !== newTestPlanId)) {
        // Buscar plan original y actualizar
        const originalTestPlan = await this.getTestPlan(originalTestPlanId);
        if (originalTestPlan && originalTestPlan.projectId) {
          await this.updateTestPlanCaseCount(originalTestPlan.projectId);
        }
      }
      
      // Actualizar el nuevo plan de pruebas (si existe)
      if (newTestPlanId) {
        const newTestPlan = await this.getTestPlan(newTestPlanId);
        if (newTestPlan && newTestPlan.projectId) {
          await this.updateTestPlanCaseCount(newTestPlan.projectId);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error updating test case ${id}:`, error);
      return false;
    }
  },

  async deleteTestCase(id: string): Promise<boolean> {
    try {
      // Obtener el caso antes de eliminarlo para conocer su plan asociado
      const caseToDelete = await this.getTestCase(id);
      const testPlanId = caseToDelete?.testPlanId;
      
      const result = await getTestCaseService().deleteTestCase(id);
      
      // Si el caso tenía un plan asociado, actualizar el contador del plan
      if (testPlanId) {
        const testPlan = await this.getTestPlan(testPlanId);
        if (testPlan && testPlan.projectId) {
          await this.updateTestPlanCaseCount(testPlan.projectId);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error deleting test case ${id}:`, error);
      return false;
    }
  },

  // Planes de Prueba
  async getAllTestPlans(): Promise<TestPlan[]> {
    try {
      return getTestPlanService().getAllTestPlans();
    } catch (error) {
      console.error('Error reading test plans:', error);
      return [];
    }
  },

  async getTestPlansByProject(projectId: string): Promise<TestPlan[]> {
    try {
      return getTestPlanService().getTestPlansByProject(projectId);
    } catch (error) {
      console.error(`Error getting test plans for project ${projectId}:`, error);
      return [];
    }
  },

  async getTestPlan(id: string): Promise<TestPlan | null> {
    try {
      return getTestPlanService().getTestPlan(id);
    } catch (error) {
      console.error(`Error getting test plan ${id}:`, error);
      return null;
    }
  },

  async saveTestPlan(testPlan: TestPlan): Promise<boolean> {
    try {
      return getTestPlanService().saveTestPlan(testPlan);
    } catch (error) {
      console.error('Error saving test plan:', error);
      return false;
    }
  },

  async updateTestPlan(id: string, updatedTestPlan: Partial<TestPlan>): Promise<boolean> {
    try {
      return getTestPlanService().updateTestPlan(id, updatedTestPlan);
    } catch (error) {
      console.error(`Error updating test plan ${id}:`, error);
      return false;
    }
  },

  async deleteTestPlan(id: string): Promise<boolean> {
    try {
      return getTestPlanService().deleteTestPlan(id);
    } catch (error) {
      console.error(`Error deleting test plan ${id}:`, error);
      return false;
    }
  },
  
  // Actualizar automáticamente el contador de casos totales en un plan de prueba
  async updateTestPlanCaseCount(projectId: string): Promise<boolean> {
    try {
      // Obtener todos los planes de prueba del proyecto
      const testPlans = await this.getTestPlansByProject(projectId);
      
      // Para cada plan, contar cuántos casos de prueba están asociados
      for (const plan of testPlans) {
        const testCases = await this.getAllTestCases();
        const casesForThisPlan = testCases.filter(tc => tc.testPlanId === plan.id);
        const totalCases = casesForThisPlan.length;
        
        // Actualizar el plan solo si el contador de casos ha cambiado
        if (plan.totalCases !== totalCases) {
          await this.updateTestPlan(plan.id, { totalCases });
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating test plan case count for project ${projectId}:`, error);
      return false;
    }
  },
  // Estadísticas
  async getTestCaseStatsByProject(projectId: string, testPlanId?: string): Promise<any> {
    try {
      // Obtener casos de prueba por proyecto
      let testCases = await this.getTestCasesByProject(projectId);
      
      // Filtrar por plan de prueba si se proporciona
      if (testPlanId) {
        testCases = testCases.filter(tc => tc.testPlanId === testPlanId);
      }
      
      // Estadísticas por estado
      const statusStats = {
        'No ejecutado': 0,
        'Exitoso': 0,
        'Fallido': 0,
        'Bloqueado': 0,
        'En progreso': 0
      };
      
      testCases.forEach(tc => {
        if (tc.status && statusStats.hasOwnProperty(tc.status)) {
          statusStats[tc.status]++;
        }
      });
      
      // Actualizar automáticamente el contador de casos totales en el plan de prueba
      await this.updateTestPlanCaseCount(projectId);
      
      // Estadísticas por ciclo
      const cycleStats: Record<number, { designed: number, successful: number, notExecuted: number, defects: number }> = {};
      testCases.forEach(tc => {
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
          }
        }
      });
      
      return {
        totalCases: testCases.length,
        statusStats,
        cycleStats
      };
    } catch (error) {
      console.error(`Error getting test case stats for project ${projectId}:`, error);
      return {
        totalCases: 0,
        statusStats: {},
        cycleStats: {}
      };
    }
  },

  async getDetailedStats(projectId?: string, cycle?: number): Promise<any> {
    try {
      const testCases = projectId 
        ? await this.getTestCasesByProject(projectId)
        : await this.getAllTestCases();
        
      // Filtrar por ciclo si se proporcionó
      const filteredCases = cycle !== undefined
        ? testCases.filter(tc => tc.cycle === cycle)
        : testCases;
      
      // Estadísticas por estado
      const statusStats = filteredCases.reduce((acc, tc) => {
        acc[tc.status] = (acc[tc.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Estadísticas por tipo de prueba
      const typeStats = filteredCases.reduce((acc, tc) => {
        acc[tc.testType] = (acc[tc.testType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Obtener todos los ciclos y su progreso
      const allCycles = [...new Set(testCases.map(tc => tc.cycle))].sort();
      const cycleProgress = allCycles.map(cycleNum => {
        const casesInCycle = testCases.filter(tc => tc.cycle === cycleNum);
        const successful = casesInCycle.filter(tc => tc.status === 'Exitoso').length;
        const failed = casesInCycle.filter(tc => tc.status === 'Fallido').length;
        const blocked = casesInCycle.filter(tc => tc.status === 'Bloqueado').length;
        const inProgress = casesInCycle.filter(tc => tc.status === 'En progreso').length;
        const notExecuted = casesInCycle.filter(tc => tc.status === 'No ejecutado').length;
        const totalDefects = casesInCycle.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
        
        return {
          cycle: cycleNum,
          total: casesInCycle.length,
          executed: successful + failed + blocked,
          successful,
          failed,
          blocked,
          inProgress,
          notExecuted,
          defects: totalDefects,
          defectRatio: casesInCycle.length > 0 ? Number((totalDefects / casesInCycle.length).toFixed(2)) : 0
        };
      });
      
      // Obtener historias de usuario y sus estadísticas
      const userStories = [...new Set(filteredCases.map(tc => tc.userStoryId))].filter(Boolean);
      const userStoryStats = userStories.map(storyId => {
        const storyCases = filteredCases.filter(tc => tc.userStoryId === storyId);
        const successful = storyCases.filter(tc => tc.status === 'Exitoso').length;
        const failed = storyCases.filter(tc => tc.status === 'Fallido').length;
        const notExecuted = storyCases.filter(tc => tc.status === 'No ejecutado').length;
        const totalDefects = storyCases.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
        
        return {
          userStoryId: storyId,
          total: storyCases.length,
          successful,
          failed,
          notExecuted,
          defects: totalDefects
        };
      });
      
      // Calcular tendencias de calidad entre ciclos
      const qualityTrend = allCycles.length > 1 
        ? allCycles.map((cycleNum, index) => {
            const currentCycle = cycleProgress.find(cp => cp.cycle === cycleNum);
            const prevCycle = index > 0 
              ? cycleProgress.find(cp => cp.cycle === allCycles[index - 1])
              : null;
              
            // Calcular cambio porcentual en defectos entre ciclos
            const defectChange = prevCycle 
              ? (currentCycle!.defectRatio - prevCycle.defectRatio) / prevCycle.defectRatio * 100
              : 0;
              
            return {
              cycle: cycleNum,
              defectRatio: currentCycle!.defectRatio,
              defectChange: Number(defectChange.toFixed(2)),
              improvement: defectChange <= 0
            };
          })
        : [];
      
      return {
        total: filteredCases.length,
        statusStats,
        typeStats,
        cycleProgress,
        userStoryStats,
        qualityTrend,
        defectsByCycle: cycleProgress.map(cp => ({
          cycle: cp.cycle,
          defects: cp.defects,
          defectRatio: cp.defectRatio
        }))
      };
    } catch (error) {
      console.error('Error getting detailed test case stats:', error);
      return {
        total: 0,
        statusStats: {},
        typeStats: {},
        cycleProgress: [],
        userStoryStats: [],
        qualityTrend: [],
        defectsByCycle: []
      };
    }
  },

  async generateUniqueCodeRef(prefix: string): Promise<string> {
    try {
      const testCases = await this.getAllTestCases();
      // Filtramos los casos que empiezan con el mismo prefijo
      const casesWithPrefix = testCases.filter(tc => tc.codeRef && tc.codeRef.startsWith(prefix));
      
      // Si no hay casos con este prefijo, empezamos con el número 1
      if (casesWithPrefix.length === 0) {
        return `${prefix}001`;
      }
      
      // Extraemos los números del final de los códigos existentes
      const numbers = casesWithPrefix
        .map(tc => {
          // Extraer el número del final del código (después del último guion)
          const match = tc.codeRef.match(/[0-9]+$/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      // Encontramos el número más alto y le sumamos 1
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      
      // Formateamos el número para que tenga al menos 3 dígitos
      const formattedNumber = String(nextNumber).padStart(3, '0');
      return `${prefix}${formattedNumber}`;
    } catch (error) {
      console.error('Error generating unique code ref:', error);
      // Si ocurre un error, generamos un código basado en la marca de tiempo
      return `${prefix}${Date.now().toString().slice(-5)}`;
    }
  },

  // Actualizar masivamente la persona responsable para múltiples casos de prueba por IDs
  async bulkUpdateResponsiblePerson(testCaseIds: string[], responsiblePerson: string): Promise<{updatedCount: number}> {
    try {
      // Asegurarse de que estamos usando el servicio de Prisma
      if (!migrationConfig.services.testCases) {
        console.error('La funcionalidad de actualización masiva solo está disponible con PostgreSQL');
        return { updatedCount: 0 };
      }
      
      return testCasePrismaService.bulkUpdateResponsiblePerson(testCaseIds, responsiblePerson);
    } catch (error) {
      console.error('Error en actualización masiva de persona responsable por IDs:', error);
      return { updatedCount: 0 };
    }
  },

  // Actualizar masivamente la persona responsable para casos de prueba que coincidan con los filtros
  async bulkUpdateResponsiblePersonByFilters(
    responsiblePerson: string,
    filters: { projectId?: string; testPlanId?: string; status?: string; cycle?: number; onlyNull?: boolean }
  ): Promise<{updatedCount: number; totalFiltered: number}> {
    try {
      // Asegurarse de que estamos usando el servicio de Prisma
      if (!migrationConfig.services.testCases) {
        console.error('La funcionalidad de actualización masiva solo está disponible con PostgreSQL');
        return { updatedCount: 0, totalFiltered: 0 };
      }
      
      const result = await testCasePrismaService.bulkUpdateResponsiblePersonByFilters(
        responsiblePerson,
        filters
      );
      
      // Si se actualizaron casos, actualizar también el contador en los planes afectados
      if (result.updatedCount > 0 && filters.projectId) {
        await this.updateTestPlanCaseCount(filters.projectId);
      }
      
      return result;
    } catch (error) {
      console.error('Error en actualización masiva de persona responsable por filtros:', error);
      return { updatedCount: 0, totalFiltered: 0 };
    }
  },
}
