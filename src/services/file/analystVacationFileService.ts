'use client';

import { AnalystVacation } from '@/models/AnalystVacation';
import { v4 as uuidv4 } from 'uuid';

// Constante para indicar si estamos en el servidor
const isServer = typeof window === 'undefined';

export class AnalystVacationFileService {
  constructor() {
    console.warn('[AnalystVacationFileService] Iniciado en modo compatible');
  }
  async getAllVacations(): Promise<AnalystVacation[]> {
    console.warn('[AnalystVacationFileService] getAllVacations: Se recomienda usar PostgreSQL');
    return [];
  }
    async getVacationsByAnalyst(analystId: string): Promise<AnalystVacation[]> {
    console.warn(`[AnalystVacationFileService] getVacationsByAnalyst: Se recomienda usar PostgreSQL`);
    return [];
  }
  async createVacation(vacation: Omit<AnalystVacation, 'id'>): Promise<AnalystVacation> {
    console.warn('[AnalystVacationFileService] createVacation: Se recomienda usar PostgreSQL');
    
    const newVacation = {
      id: uuidv4(),
      ...vacation,
      startDate: vacation.startDate,
      endDate: vacation.endDate
    };
    
    return newVacation;
  }
  async deleteVacation(id: string): Promise<boolean> {
    console.warn('[AnalystVacationFileService] deleteVacation: Se recomienda usar PostgreSQL');
    return true; // Simulamos éxito pero no hacemos nada realmente
  }
}
