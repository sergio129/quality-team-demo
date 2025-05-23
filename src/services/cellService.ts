import { Cell } from '@/models/Cell';
import { CellFileService } from './file/cellFileService';
import { CellPrismaService } from './prisma/cellPrismaService';
import { migrationConfig } from '@/config/migration';

export class CellService {
    private fileService: CellFileService;
    private prismaService: CellPrismaService;
    private usePostgres: boolean;

    constructor() {
        this.fileService = new CellFileService();
        this.prismaService = new CellPrismaService();
        this.usePostgres = migrationConfig.shouldUsePostgresFor('cells');
        
        // Log que base de datos estamos usando si el logging está habilitado
        if (migrationConfig.logging.enabled) {
            console.log(`[CellService] Using ${this.usePostgres ? 'PostgreSQL' : 'File'} storage`);
        }
    }

    async getAllCells(): Promise<Cell[]> {
        try {
            const result = this.usePostgres 
                ? await this.prismaService.getAllCells() 
                : await this.fileService.getAllCells();
                
            return result;
        } catch (error) {
            console.error(`[CellService] Error in getAllCells:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[CellService] Falling back to file storage');
                return await this.fileService.getAllCells();
            }
            throw error;
        }
    }
    
    async saveCell(cell: Cell): Promise<Cell | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.saveCell(cell)
                : await this.fileService.saveCell(cell);
                
            return result;
        } catch (error) {
            console.error(`[CellService] Error in saveCell:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[CellService] Falling back to file storage');
                return await this.fileService.saveCell(cell);
            }
            return null;
        }
    }

    async updateCell(id: string, cell: Partial<Cell>): Promise<Cell | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.updateCell(id, cell)
                : await this.fileService.updateCell(id, cell);
                
            return result;
        } catch (error) {
            console.error(`[CellService] Error in updateCell:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[CellService] Falling back to file storage');
                return await this.fileService.updateCell(id, cell);
            }
            return null;
        }
    }

    async deleteCell(id: string): Promise<boolean> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.deleteCell(id)
                : await this.fileService.deleteCell(id);
                
            return result;
        } catch (error) {
            console.error(`[CellService] Error in deleteCell:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[CellService] Falling back to file storage');
                return await this.fileService.deleteCell(id);
            }
            return false;
        }
    }

    async getCellById(id: string): Promise<Cell | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getCellById(id)
                : await this.fileService.getCellById(id);
                
            return result;
        } catch (error) {
            console.error(`[CellService] Error in getCellById:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[CellService] Falling back to file storage');
                return await this.fileService.getCellById(id);
            }
            return null;
        }
    }

    async getCellsByTeamId(teamId: string): Promise<Cell[]> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getCellsByTeamId(teamId)
                : await this.fileService.getCellsByTeamId(teamId);
                
            return result;
        } catch (error) {
            console.error(`[CellService] Error in getCellsByTeamId:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres) {
                console.log('[CellService] Falling back to file storage');
                return await this.fileService.getCellsByTeamId(teamId);
            }
            return [];
        }
    }
}
