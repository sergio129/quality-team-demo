import { Incident } from '../models/Incident';
import { IncidentFileService } from './file/incidentFileService';
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
    private fileService: IncidentFileService;
    private prismaService: IncidentPrismaService;
    private usePostgres: boolean;

    constructor() {
        this.fileService = new IncidentFileService();
        this.prismaService = new IncidentPrismaService();
        this.usePostgres = migrationConfig.shouldUsePostgresFor('incidents');
        
        // Log qué base de datos estamos usando si el logging está habilitado
        if (migrationConfig.logging.enabled) {
            console.log(`[IncidentService] Using ${this.usePostgres ? 'PostgreSQL' : 'File'} storage`);
        }
    }

    async getAll(): Promise<Incident[]> {
        try {
            const result = this.usePostgres 
                ? await this.prismaService.getAll() 
                : await this.fileService.getAll();
                
            return result;
        } catch (error) {
            console.error(`[IncidentService] Error in getAll:`, error);
            // En caso de error con PostgreSQL, intentar con archivos si fallback está habilitado
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[IncidentService] Falling back to file storage');
                return await this.fileService.getAll();
            }
            throw error;
        }
    }

    async save(incident: Partial<Incident>): Promise<Incident> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.save(incident)
                : await this.fileService.save(incident);
                
            return result;
        } catch (error) {
            console.error(`[IncidentService] Error in save:`, error);
            // En caso de error con PostgreSQL, intentar con archivos si fallback está habilitado
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[IncidentService] Falling back to file storage');
                return await this.fileService.save(incident);
            }
            throw error;
        }
    }

    async update(id: string, incident: Partial<Incident>): Promise<Incident | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.update(id, incident)
                : await this.fileService.update(id, incident);
                
            return result;
        } catch (error) {
            console.error(`[IncidentService] Error in update:`, error);
            // En caso de error con PostgreSQL, intentar con archivos si fallback está habilitado
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[IncidentService] Falling back to file storage');
                return await this.fileService.update(id, incident);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            if (this.usePostgres) {
                await this.prismaService.delete(id);
            } else {
                await this.fileService.delete(id);
            }
        } catch (error) {
            console.error(`[IncidentService] Error in delete:`, error);
            // En caso de error con PostgreSQL, intentar con archivos si fallback está habilitado
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[IncidentService] Falling back to file storage');
                await this.fileService.delete(id);
            } else {
                throw error;
            }
        }
    }
    
    async getStats(): Promise<IncidentStats> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getStats()
                : await this.fileService.getStats();
                
            return result;
        } catch (error) {
            console.error(`[IncidentService] Error in getStats:`, error);
            // En caso de error con PostgreSQL, intentar con archivos si fallback está habilitado
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[IncidentService] Falling back to file storage');
                return await this.fileService.getStats();
            }
            throw error;
        }
    }
}

// Exportar una instancia del servicio para mantener compatibilidad con el código existente
export const incidentService = new IncidentService();
