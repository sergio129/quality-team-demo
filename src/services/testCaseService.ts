const fs = require('fs').promises;
const path = require('path');
import { TestCase, TestPlan } from '@/models/TestCase';

const TEST_CASES_FILE_PATH = path.join(process.cwd(), 'data', 'test-cases.txt');
const TEST_PLANS_FILE_PATH = path.join(process.cwd(), 'data', 'test-plans.txt');

// Función para asegurar que existen los archivos de datos
async function ensureDataFilesExist() {
  try {
    // Verificar archivo de casos de prueba
    try {
      await fs.access(TEST_CASES_FILE_PATH);
    } catch (error) {
      // El archivo no existe, crearlo con un array vacío
      await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify([], null, 2));
    }

    // Verificar archivo de planes de prueba
    try {
      await fs.access(TEST_PLANS_FILE_PATH);
    } catch (error) {
      // El archivo no existe, crearlo con un array vacío
      await fs.writeFile(TEST_PLANS_FILE_PATH, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error al asegurar que existan los archivos de datos:', error);
  }
}

// Asegurar que los archivos existan al importar el servicio
ensureDataFilesExist();

export const testCaseService = {
  async getAllTestCases(): Promise<TestCase[]> {
    try {
      const fileContent = await fs.readFile(TEST_CASES_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading test cases:', error);
      return [];
    }
  },

  async getTestCasesByProject(projectId: string): Promise<TestCase[]> {
    try {
      const testCases = await this.getAllTestCases();
      return testCases.filter(testCase => testCase.projectId === projectId);
    } catch (error) {
      console.error(`Error getting test cases for project ${projectId}:`, error);
      return [];
    }
  },

  async getTestCase(id: string): Promise<TestCase | null> {
    try {
      const testCases = await this.getAllTestCases();
      const testCase = testCases.find(tc => tc.id === id);
      return testCase || null;
    } catch (error) {
      console.error(`Error getting test case ${id}:`, error);
      return null;
    }
  },

  async saveTestCase(testCase: TestCase): Promise<boolean> {
    try {
      const testCases = await this.getAllTestCases();
      testCases.push(testCase);
      await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify(testCases, null, 2));
      
      // Si el caso tiene un plan de pruebas asociado, actualizar su contador
      if (testCase.testPlanId) {
        const testPlan = await this.getTestPlan(testCase.testPlanId);
        if (testPlan && testPlan.projectId) {
          await this.updateTestPlanCaseCount(testPlan.projectId);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving test case:', error);
      return false;
    }
  },

  async updateTestCase(id: string, updatedTestCase: Partial<TestCase>): Promise<boolean> {
    try {
      const testCases = await this.getAllTestCases();
      const index = testCases.findIndex(tc => tc.id === id);
      if (index !== -1) {
        const originalTestPlanId = testCases[index].testPlanId;
        const newTestPlanId = updatedTestCase.testPlanId;
        
        testCases[index] = { ...testCases[index], ...updatedTestCase, updatedAt: new Date().toISOString() };
        await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify(testCases, null, 2));
        
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
        
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating test case ${id}:`, error);
      return false;
    }
  },

  async deleteTestCase(id: string): Promise<boolean> {
    try {
      const testCases = await this.getAllTestCases();
      const caseToDelete = testCases.find(tc => tc.id === id);
      const testPlanId = caseToDelete?.testPlanId;
      
      const filteredTestCases = testCases.filter(tc => tc.id !== id);
      await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify(filteredTestCases, null, 2));
      
      // Si el caso tenía un plan asociado, actualizar el contador del plan
      if (testPlanId) {
        const testPlan = await this.getTestPlan(testPlanId);
        if (testPlan && testPlan.projectId) {
          await this.updateTestPlanCaseCount(testPlan.projectId);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting test case ${id}:`, error);
      return false;
    }
  },

  // Planes de Prueba
  async getAllTestPlans(): Promise<TestPlan[]> {
    try {
      const fileContent = await fs.readFile(TEST_PLANS_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading test plans:', error);
      return [];
    }
  },

  async getTestPlansByProject(projectId: string): Promise<TestPlan[]> {
    try {
      const testPlans = await this.getAllTestPlans();
      return testPlans.filter(plan => plan.projectId === projectId);
    } catch (error) {
      console.error(`Error getting test plans for project ${projectId}:`, error);
      return [];
    }
  },

  async getTestPlan(id: string): Promise<TestPlan | null> {
    try {
      const testPlans = await this.getAllTestPlans();
      const testPlan = testPlans.find(plan => plan.id === id);
      return testPlan || null;
    } catch (error) {
      console.error(`Error getting test plan ${id}:`, error);
      return null;
    }
  },

  async saveTestPlan(testPlan: TestPlan): Promise<boolean> {
    try {
      const testPlans = await this.getAllTestPlans();
      testPlans.push(testPlan);
      await fs.writeFile(TEST_PLANS_FILE_PATH, JSON.stringify(testPlans, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving test plan:', error);
      return false;
    }
  },

  async updateTestPlan(id: string, updatedTestPlan: Partial<TestPlan>): Promise<boolean> {
    try {
      const testPlans = await this.getAllTestPlans();
      const index = testPlans.findIndex(plan => plan.id === id);
      if (index !== -1) {
        testPlans[index] = { 
          ...testPlans[index], 
          ...updatedTestPlan, 
          updatedAt: new Date().toISOString() 
        };
        await fs.writeFile(TEST_PLANS_FILE_PATH, JSON.stringify(testPlans, null, 2));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating test plan ${id}:`, error);
      return false;
    }
  },

  async deleteTestPlan(id: string): Promise<boolean> {
    try {
      const testPlans = await this.getAllTestPlans();
      const filteredTestPlans = testPlans.filter(plan => plan.id !== id);
      await fs.writeFile(TEST_PLANS_FILE_PATH, JSON.stringify(filteredTestPlans, null, 2));
      return true;
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
      const cycleStats = {};
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
        cycleStats      };
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
}
