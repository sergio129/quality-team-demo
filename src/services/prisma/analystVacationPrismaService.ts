'use client';

import { AnalystVacation } from '@/models/AnalystVacation';
import { prisma } from '@/lib/prisma';

export class AnalystVacationPrismaService {
  constructor() {
    // Usamos la instancia singleton de Prisma en lugar de crear una nueva
  }
    async getAllVacations(): Promise<AnalystVacation[]> {
    try {
      const vacations = await prisma.analystVacation.findMany();
      
      // Convertir las fechas a objetos Date
      return vacations.map(v => ({
        ...v,
        startDate: new Date(v.startDate),
        endDate: new Date(v.endDate)
      }));
    } catch (error) {
      console.error('[AnalystVacationPrismaService] Error al obtener vacaciones:', error);
      throw error;
    }
  }
    async getVacationsByAnalyst(analystId: string): Promise<AnalystVacation[]> {
    try {
      const vacations = await prisma.analystVacation.findMany({
        where: { analystId }
      });
      
      // Convertir las fechas a objetos Date
      return vacations.map(v => ({
        ...v,
        startDate: new Date(v.startDate),
        endDate: new Date(v.endDate)
      }));
    } catch (error) {
      console.error(`[AnalystVacationPrismaService] Error al obtener vacaciones para analista ${analystId}:`, error);
      throw error;
    }
  }
    async createVacation(vacation: Omit<AnalystVacation, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalystVacation> {
    try {
      const createdVacation = await prisma.analystVacation.create({
        data: {
          analystId: vacation.analystId,
          startDate: vacation.startDate,
          endDate: vacation.endDate,
          description: vacation.description || '',
          type: vacation.type
        }
      });
      
      return {
        ...createdVacation,
        startDate: new Date(createdVacation.startDate),
        endDate: new Date(createdVacation.endDate)
      };
    } catch (error) {
      console.error('[AnalystVacationPrismaService] Error al crear vacación:', error);
      throw error;
    }
  }
    async deleteVacation(id: string): Promise<boolean> {
    try {
      await prisma.analystVacation.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error(`[AnalystVacationPrismaService] Error al eliminar vacación ${id}:`, error);
      throw error;
    }
  }
}
