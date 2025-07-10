'use client';

import { AnalystVacation } from '@/models/AnalystVacation';
import { prisma } from '@/lib/prisma';

// Función de validación para asegurarnos de que el tipo es válido
function validateVacationType(type: string): 'vacation' | 'leave' | 'training' | 'other' {
  if (['vacation', 'leave', 'training', 'other'].includes(type)) {
    return type as 'vacation' | 'leave' | 'training' | 'other';
  }
  return 'other'; // Valor por defecto si no coincide con ninguno de los válidos
}

export class AnalystVacationPrismaService {
  constructor() {
    // Usamos la instancia singleton de Prisma en lugar de crear una nueva
  }
  
  async getAllVacations(): Promise<AnalystVacation[]> {
    try {
      const vacations = await prisma.analystVacation.findMany();
      
      // Convertir las fechas a objetos Date y manejar nulls como undefined
      return vacations.map(v => ({
        ...v,
        startDate: new Date(v.startDate),
        endDate: new Date(v.endDate),
        description: v.description === null ? undefined : v.description,
        type: validateVacationType(v.type)
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
      
      // Convertir las fechas a objetos Date y manejar nulls como undefined
      return vacations.map(v => ({
        ...v,
        startDate: new Date(v.startDate),
        endDate: new Date(v.endDate),
        description: v.description === null ? undefined : v.description,
        type: validateVacationType(v.type)
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
        endDate: new Date(createdVacation.endDate),
        description: createdVacation.description === null ? undefined : createdVacation.description,
        type: validateVacationType(createdVacation.type)
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
