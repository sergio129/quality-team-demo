// testPlanPrismaService.ts
import { TestPlan } from '@/models/TestCase';
import { prisma } from '@/lib/prisma';

export default class TestPlanPrismaService {
  // Obtener todos los planes de prueba
  async getAllTestPlans(): Promise<TestPlan[]> {
    try {
      const testPlans = await prisma.testPlan.findMany({
        include: {
          cycles: true,
          testCases: true
        }
      });

      return testPlans.map(tp => this.mapPrismaTestPlanToModel(tp));
    } catch (error) {
      console.error('Error getting all test plans:', error);
      return [];
    }
  }

  // Obtener planes de prueba por proyecto
  async getTestPlansByProject(projectId: string): Promise<TestPlan[]> {
    try {
      const testPlans = await prisma.testPlan.findMany({
        where: { projectId },
        include: {
          cycles: true,
          testCases: true
        }
      });

      return testPlans.map(tp => this.mapPrismaTestPlanToModel(tp));
    } catch (error) {
      console.error(`Error getting test plans for project ${projectId}:`, error);
      return [];
    }
  }

  // Obtener un plan de prueba por ID
  async getTestPlan(id: string): Promise<TestPlan | null> {
    try {
      const testPlan = await prisma.testPlan.findUnique({
        where: { id },
        include: {
          cycles: true,
          testCases: true
        }
      });

      return testPlan ? this.mapPrismaTestPlanToModel(testPlan) : null;
    } catch (error) {
      console.error(`Error getting test plan ${id}:`, error);
      return null;
    }
  }

  // Guardar un nuevo plan de prueba
  async saveTestPlan(testPlan: TestPlan): Promise<boolean> {
    try {
      const { cycles, ...testPlanData } = testPlan;

      await prisma.testPlan.create({
        data: {
          ...testPlanData,
          startDate: new Date(testPlanData.startDate),
          endDate: new Date(testPlanData.endDate),
          createdAt: new Date(testPlanData.createdAt),
          updatedAt: new Date(testPlanData.updatedAt),
          cycles: {
            create: cycles.map(cycle => ({
              number: cycle.number,
              designed: cycle.designed,
              successful: cycle.successful,
              notExecuted: cycle.notExecuted,
              defects: cycle.defects,
              startDate: cycle.startDate ? new Date(cycle.startDate) : null,
              endDate: cycle.endDate ? new Date(cycle.endDate) : null
            }))
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving test plan:', error);
      return false;
    }
  }

  // Actualizar un plan de prueba existente
  async updateTestPlan(id: string, updatedTestPlan: Partial<TestPlan>): Promise<boolean> {
    try {
      const { cycles, ...testPlanData } = updatedTestPlan;

      // Actualizar los datos principales del plan
      await prisma.testPlan.update({
        where: { id },
        data: {
          ...testPlanData,
          startDate: testPlanData.startDate ? new Date(testPlanData.startDate) : undefined,
          endDate: testPlanData.endDate ? new Date(testPlanData.endDate) : undefined,
          updatedAt: new Date()
        }
      });

      // Si hay ciclos para actualizar
      if (cycles) {
        // Eliminar ciclos existentes
        await prisma.testCycle.deleteMany({
          where: { testPlanId: id }
        });

        // Crear nuevos ciclos
        await prisma.testCycle.createMany({
          data: cycles.map(cycle => ({
            ...cycle,
            testPlanId: id,
            startDate: cycle.startDate ? new Date(cycle.startDate) : null,
            endDate: cycle.endDate ? new Date(cycle.endDate) : null
          }))
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating test plan ${id}:`, error);
      return false;
    }
  }

  // Eliminar un plan de prueba
  async deleteTestPlan(id: string): Promise<boolean> {
    try {
      await prisma.testPlan.delete({
        where: { id }
      });
      return true;
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
        const totalCases = await prisma.testCase.count({
          where: { testPlanId: plan.id }
        });

        await this.updateTestPlan(plan.id, { totalCases });
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating test plan case count for project ${projectId}:`, error);
      return false;
    }
  }

  // Método privado para mapear un plan de prueba de Prisma a nuestro modelo
  private mapPrismaTestPlanToModel(prismaPlan: any): TestPlan {
    return {
      id: prismaPlan.id,
      projectId: prismaPlan.projectId,
      projectName: prismaPlan.projectName,
      codeReference: prismaPlan.codeReference,
      startDate: prismaPlan.startDate.toISOString(),
      endDate: prismaPlan.endDate.toISOString(),
      estimatedHours: prismaPlan.estimatedHours,
      estimatedDays: prismaPlan.estimatedDays,
      totalCases: prismaPlan.totalCases,
      cycles: prismaPlan.cycles.map((cycle: any) => ({
        id: cycle.id,
        number: cycle.number,
        designed: cycle.designed,
        successful: cycle.successful,
        notExecuted: cycle.notExecuted,
        defects: cycle.defects,
        startDate: cycle.startDate?.toISOString() || null,
        endDate: cycle.endDate?.toISOString() || null
      })),
      testQuality: prismaPlan.testQuality || 0,
      createdAt: prismaPlan.createdAt.toISOString(),
      updatedAt: prismaPlan.updatedAt.toISOString()
    };
  }
}
