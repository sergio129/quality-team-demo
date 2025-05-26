import { Incident } from '../models/Incident';
import { IncidentPrismaService } from './prisma/incidentPrismaService';
import { migrationConfig } from '@/config/migration';

export interface IncidentStats {
    totalPorCliente: { [key: string]: number };
    totalPorPrioridad: {
        Alta: number;
        Media: number;
        Baja: number;
    };
    totalAbiertas: number;
}

export class IncidentService {
    private prismaService: IncidentPrismaService;

    constructor() {
        this.prismaService = new IncidentPrismaService();
        
        // Log de base de datos en uso
        if (migrationConfig.logging.enabled) {
            console.log(`[IncidentService] Using PostgreSQL storage`);
        }
    }

    async getAll(): Promise<Incident[]> {
        try {
            return await this.prismaService.getAll();
        } catch (error) {
            console.error(`[IncidentService] Error in getAll:`, error);
            throw error;
        }
    }

    async save(incident: Partial<Incident>): Promise<Incident> {
        try {
            return await this.prismaService.save(incident);
        } catch (error) {
            console.error(`[IncidentService] Error in save:`, error);
            throw error;
        }
    }

    async update(id: string, incident: Partial<Incident>): Promise<Incident | null> {
        try {
            return await this.prismaService.update(id, incident);
        } catch (error) {
            console.error(`[IncidentService] Error in update:`, error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.prismaService.delete(id);
        } catch (error) {
            console.error(`[IncidentService] Error in delete:`, error);
            throw error;
        }
    }
    
    async getStats(): Promise<IncidentStats> {
        try {
            return await this.prismaService.getStats();
        } catch (error) {
            console.error(`[IncidentService] Error in getStats:`, error);
            throw error;
        }
    }

    async attachImage(incidentId: string, image: any): Promise<string> {
        try {
            return await this.prismaService.attachImageToIncident(incidentId, image);
        } catch (error) {
            console.error(`[IncidentService] Error al adjuntar imagen:`, error);
            throw error;
        }
    }

    async getImages(incidentId: string): Promise<any[]> {
        try {
            return await this.prismaService.getImagesForIncident(incidentId);
        } catch (error) {
            console.error(`[IncidentService] Error al obtener imágenes:`, error);
            throw error;
        }
    }

    async deleteImage(imageId: string): Promise<void> {
        try {
            await this.prismaService.deleteImage(imageId);
        } catch (error) {
            console.error(`[IncidentService] Error al eliminar imagen:`, error);
            throw error;
        }
    }
}

// Exportar una instancia del servicio para mantener compatibilidad con el código existente
export const incidentService = new IncidentService();
