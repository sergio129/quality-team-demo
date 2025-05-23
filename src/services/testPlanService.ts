import { TestPlan } from '@/models/TestCase';
import { migrationConfig } from '@/config/migration';
import TestPlanFileService from './file/testPlanFileService';
import TestPlanPrismaService from './prisma/testPlanPrismaService';

// Crear una instancia de cada servicio
const fileService = new TestPlanFileService();
const prismaService = new TestPlanPrismaService();

// Función para determinar qué servicio usar
function getService() {
  return migrationConfig.services.testPlans ? prismaService : fileService;
};

export const testPlanService = {
  async getAllTestPlans(): Promise<TestPlan[]> {
    return getService().getAllTestPlans();
  },

  async getTestPlansByProject(projectId: string): Promise<TestPlan[]> {
    return getService().getTestPlansByProject(projectId);
  },

  async getTestPlan(id: string): Promise<TestPlan | null> {
    return getService().getTestPlan(id);
  },

  async saveTestPlan(testPlan: TestPlan): Promise<boolean> {
    return getService().saveTestPlan(testPlan);
  },

  async updateTestPlan(id: string, updatedTestPlan: Partial<TestPlan>): Promise<boolean> {
    return getService().updateTestPlan(id, updatedTestPlan);
  },

  async deleteTestPlan(id: string): Promise<boolean> {
    return getService().deleteTestPlan(id);
  },
  
  // Actualizar automáticamente el contador de casos totales en un plan de prueba
  async updateTestPlanCaseCount(projectId: string): Promise<boolean> {
    return getService().updateTestPlanCaseCount(projectId);
  }
};
