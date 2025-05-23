// testPlanFileService.ts
const fs = require('fs').promises;
const path = require('path');
import { TestPlan } from '@/models/TestCase';

const TEST_PLANS_FILE_PATH = path.join(process.cwd(), 'data', 'test-plans.txt');

export default class TestPlanFileService {
  // Asegurar que el archivo existe
  private async ensureDataFileExists() {
    try {
      await fs.access(TEST_PLANS_FILE_PATH);
    } catch (error) {
      await fs.writeFile(TEST_PLANS_FILE_PATH, JSON.stringify([], null, 2));
    }
  }

  // Obtener todos los planes de prueba
  async getAllTestPlans(): Promise<TestPlan[]> {
    try {
      await this.ensureDataFileExists();
      const fileContent = await fs.readFile(TEST_PLANS_FILE_PATH, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading test plans:', error);
      return [];
    }
  }

  // Obtener planes de prueba por proyecto
  async getTestPlansByProject(projectId: string): Promise<TestPlan[]> {
    try {
      const testPlans = await this.getAllTestPlans();
      return testPlans.filter(plan => plan.projectId === projectId);
    } catch (error) {
      console.error(`Error getting test plans for project ${projectId}:`, error);
      return [];
    }
  }

  // Obtener un plan de prueba por ID
  async getTestPlan(id: string): Promise<TestPlan | null> {
    try {
      const testPlans = await this.getAllTestPlans();
      const testPlan = testPlans.find(plan => plan.id === id);
      return testPlan || null;
    } catch (error) {
      console.error(`Error getting test plan ${id}:`, error);
      return null;
    }
  }

  // Guardar un nuevo plan de prueba
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
  }

  // Actualizar un plan de prueba existente
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
  }

  // Eliminar un plan de prueba
  async deleteTestPlan(id: string): Promise<boolean> {
    try {
      const testPlans = await this.getAllTestPlans();
      const filteredTestPlans = testPlans.filter(plan => plan.id !== id);
      
      if (testPlans.length !== filteredTestPlans.length) {
        await fs.writeFile(TEST_PLANS_FILE_PATH, JSON.stringify(filteredTestPlans, null, 2));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting test plan ${id}:`, error);
      return false;
    }
  }

  // Actualizar el contador de casos en un plan de prueba
  async updateTestPlanCaseCount(projectId: string): Promise<boolean> {
    try {
      const testPlans = await this.getTestPlansByProject(projectId);
      
      for (const plan of testPlans) {
        const testCases = await fs.readFile(path.join(process.cwd(), 'data', 'test-cases.txt'), 'utf-8');
        const cases = JSON.parse(testCases);
        const totalCases = cases.filter((tc: any) => tc.testPlanId === plan.id).length;
        
        await this.updateTestPlan(plan.id, { totalCases });
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating test plan case count for project ${projectId}:`, error);
      return false;
    }
  }
}
