'use client';

import { AnalystVacation } from '@/models/AnalystVacation';
import { AnalystVacationPrismaService } from './prisma/analystVacationPrismaService';
import { migrationConfig } from '@/config/migration';

export class AnalystVacationService {
  private prismaService: AnalystVacationPrismaService;
  
  constructor() {
    this.prismaService = new AnalystVacationPrismaService();
    
    // Log para indicar que siempre estamos usando PostgreSQL
    if (migrationConfig.logging && migrationConfig.logging.enabled) {
      console.log(`[AnalystVacationService] Using PostgreSQL storage (forced)`);
    }
  }
  
  async getAllVacations(): Promise<AnalystVacation[]> {
    try {
      return await this.prismaService.getAllVacations();
    } catch (error) {
      console.error(`[AnalystVacationService] Error en getAllVacations:`, error);
      throw error;
    }
  }
  
  async getVacationsByAnalyst(analystId: string): Promise<AnalystVacation[]> {
    try {
      return await this.prismaService.getVacationsByAnalyst(analystId);
    } catch (error) {
      console.error(`[AnalystVacationService] Error en getVacationsByAnalyst:`, error);
      throw error;
    }
  }
  
  async createVacation(vacation: Omit<AnalystVacation, 'id'>): Promise<AnalystVacation> {
    try {
      return await this.prismaService.createVacation(vacation);
    } catch (error) {
      console.error(`[AnalystVacationService] Error en createVacation:`, error);
      throw error;
    }
  }
  
  async deleteVacation(id: string): Promise<boolean> {
    try {
      return await this.prismaService.deleteVacation(id);
    } catch (error) {
      console.error(`[AnalystVacationService] Error en deleteVacation:`, error);
      throw error;
    }
  }
}

// Instancia singleton para usar en la aplicación
export const analystVacationService = new AnalystVacationService();
