import { QAAnalyst } from '@/models/QAAnalyst';
import { QAAnalystFileService } from './file/qaAnalystFileService';
import { QAAnalystPrismaService } from './prisma/qaAnalystPrismaService';
import { migrationConfig } from '@/config/migration';

export class QAAnalystService {
    private fileService: QAAnalystFileService;
    private prismaService: QAAnalystPrismaService;
    private usePostgres: boolean;

    constructor() {
        this.fileService = new QAAnalystFileService();
        this.prismaService = new QAAnalystPrismaService();
        this.usePostgres = migrationConfig.shouldUsePostgresFor('analysts');
        
        // Log que base de datos estamos usando si el logging está habilitado
        if (migrationConfig.logging.enabled) {
            console.log(`[QAAnalystService] Using ${this.usePostgres ? 'PostgreSQL' : 'File'} storage`);
        }
    }

    async getAllAnalysts(): Promise<QAAnalyst[]> {
        try {
            const result = this.usePostgres 
                ? await this.prismaService.getAllAnalysts() 
                : await this.fileService.getAllAnalysts();
                
            return result;
        } catch (error) {
            console.error(`[QAAnalystService] Error in getAllAnalysts:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[QAAnalystService] Falling back to file storage');
                return await this.fileService.getAllAnalysts();
            }
            throw error;
        }
    }
    
    async saveAnalyst(analyst: QAAnalyst): Promise<QAAnalyst | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.saveAnalyst(analyst)
                : await this.fileService.saveAnalyst(analyst);
                
            return result;
        } catch (error) {
            console.error(`[QAAnalystService] Error in saveAnalyst:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[QAAnalystService] Falling back to file storage');
                return await this.fileService.saveAnalyst(analyst);
            }
            return null;
        }
    }

    async updateAnalyst(id: string, analyst: Partial<QAAnalyst>): Promise<QAAnalyst | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.updateAnalyst(id, analyst)
                : await this.fileService.updateAnalyst(id, analyst);
                
            return result;
        } catch (error) {
            console.error(`[QAAnalystService] Error in updateAnalyst:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[QAAnalystService] Falling back to file storage');
                return await this.fileService.updateAnalyst(id, analyst);
            }
            return null;
        }
    }

    async deleteAnalyst(id: string): Promise<boolean> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.deleteAnalyst(id)
                : await this.fileService.deleteAnalyst(id);
                
            return result;
        } catch (error) {
            console.error(`[QAAnalystService] Error in deleteAnalyst:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[QAAnalystService] Falling back to file storage');
                return await this.fileService.deleteAnalyst(id);
            }
            return false;
        }
    }

    async getAnalystById(id: string): Promise<QAAnalyst | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getAnalystById(id)
                : await this.fileService.getAnalystById(id);
                
            return result;
        } catch (error) {
            console.error(`[QAAnalystService] Error in getAnalystById:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[QAAnalystService] Falling back to file storage');
                return await this.fileService.getAnalystById(id);
            }
            return null;
        }
    }

    async getAnalystsByCellId(cellId: string): Promise<QAAnalyst[]> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getAnalystsByCellId(cellId)
                : await this.fileService.getAnalystsByCellId(cellId);
                
            return result;
        } catch (error) {
            console.error(`[QAAnalystService] Error in getAnalystsByCellId:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[QAAnalystService] Falling back to file storage');
                return await this.fileService.getAnalystsByCellId(cellId);
            }
            return [];
        }
    }
}
