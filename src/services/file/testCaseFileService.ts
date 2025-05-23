// testCaseFileService.ts
const fs = require('fs').promises;
const path = require('path');
import { TestCase } from '@/models/TestCase';

const TEST_CASES_FILE_PATH = path.join(process.cwd(), 'data', 'test-cases.txt');

class TestCaseFileService {
  // Asegurar que el archivo existe
  private async ensureDataFileExists() {
    try {
      await fs.access(TEST_CASES_FILE_PATH);
    } catch (error) {
      await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify([], null, 2));
    }
  }

  // Leer todos los casos de prueba
  async getAllTestCases(): Promise<TestCase[]> {
    try {
      await this.ensureDataFileExists();
      const fileContent = await fs.readFile(TEST_CASES_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading test cases:', error);
      return [];
    }
  }

  // Obtener casos de prueba por proyecto
  async getTestCasesByProject(projectId: string, testPlanId?: string): Promise<TestCase[]> {
    try {
      const testCases = await this.getAllTestCases();
      return testCases.filter(testCase => {
        if (testPlanId) {
          return testCase.projectId === projectId && testCase.testPlanId === testPlanId;
        }
        return testCase.projectId === projectId;
      });
    } catch (error) {
      console.error(`Error getting test cases for project ${projectId}:`, error);
      return [];
    }
  }

  // Obtener un caso de prueba por ID
  async getTestCase(id: string): Promise<TestCase | null> {
    try {
      const testCases = await this.getAllTestCases();
      const testCase = testCases.find(tc => tc.id === id);
      return testCase || null;
    } catch (error) {
      console.error(`Error getting test case ${id}:`, error);
      return null;
    }
  }

  // Guardar un nuevo caso de prueba
  async saveTestCase(testCase: TestCase): Promise<boolean> {
    try {
      const testCases = await this.getAllTestCases();
      testCases.push(testCase);
      await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify(testCases, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving test case:', error);
      return false;
    }
  }

  // Actualizar un caso de prueba existente
  async updateTestCase(id: string, updatedTestCase: Partial<TestCase>): Promise<boolean> {
    try {
      const testCases = await this.getAllTestCases();
      const index = testCases.findIndex(tc => tc.id === id);
      if (index !== -1) {
        testCases[index] = { 
          ...testCases[index], 
          ...updatedTestCase,
          updatedAt: new Date().toISOString()
        };
        await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify(testCases, null, 2));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating test case ${id}:`, error);
      return false;
    }
  }

  // Eliminar un caso de prueba
  async deleteTestCase(id: string): Promise<boolean> {
    try {
      const testCases = await this.getAllTestCases();
      const filteredTestCases = testCases.filter(tc => tc.id !== id);
      if (testCases.length !== filteredTestCases.length) {
        await fs.writeFile(TEST_CASES_FILE_PATH, JSON.stringify(filteredTestCases, null, 2));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting test case ${id}:`, error);
      return false;
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

      const cycleStats = {};
      const statsByType = {};
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
      };    } catch (error) {
      console.error(`Error getting test case stats for project ${projectId}:`, error);
      return null;
    }
  }
}

export default TestCaseFileService;
