import { Project } from '@/models/Project';
import { ProjectFileService } from './file/projectFileService';
import { ProjectPrismaService } from './prisma/projectPrismaService';
import { ProjectPrismaServiceDebug } from './prisma/projectPrismaService.debug';
import { migrationConfig } from '@/config/migration';

export class ProjectService {
    private fileService: ProjectFileService;
    private prismaService: ProjectPrismaService;
    private debugPrismaService: ProjectPrismaServiceDebug;
    private usePostgres: boolean;

    constructor() {
        this.fileService = new ProjectFileService();
        this.prismaService = new ProjectPrismaService();
        this.debugPrismaService = new ProjectPrismaServiceDebug();
        this.usePostgres = migrationConfig.shouldUsePostgresFor('projects');
        
        // Log qué base de datos estamos usando si el logging está habilitado
        if (migrationConfig.logging.enabled) {
            console.log(`[ProjectService] Using ${this.usePostgres ? 'PostgreSQL' : 'File'} storage`);
        }
    }

    async getAllProjects(): Promise<Project[]> {
        try {
            const result = this.usePostgres 
                ? await this.prismaService.getAllProjects() 
                : await this.fileService.getAllProjects();
                
            return result;
        } catch (error) {
            console.error(`[ProjectService] Error in getAllProjects:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[ProjectService] Falling back to file storage');
                return await this.fileService.getAllProjects();
            }
            throw error;
        }
    }

    async saveProject(project: Project): Promise<boolean> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.saveProject(project)
                : await this.fileService.saveProject(project);
                
            return result;
        } catch (error) {
            console.error(`[ProjectService] Error in saveProject:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[ProjectService] Falling back to file storage');
                return await this.fileService.saveProject(project);
            }
            return false;
        }
    }

    async updateProject(idJira: string, updatedProject: Partial<Project>): Promise<boolean> {
        try {
            console.log(`[ProjectService] Actualizando proyecto ${idJira} usando versión debug`);
            
            const result = this.usePostgres
                ? await this.debugPrismaService.updateProject(idJira, updatedProject)
                : await this.fileService.updateProject(idJira, updatedProject);
                
            return result;
        } catch (error) {
            console.error(`[ProjectService] Error in updateProject:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[ProjectService] Falling back to file storage');
                return await this.fileService.updateProject(idJira, updatedProject);
            }
            return false;
        }
    }

    async deleteProject(idJira: string): Promise<boolean> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.deleteProject(idJira)
                : await this.fileService.deleteProject(idJira);
                
            return result;
        } catch (error) {
            console.error(`[ProjectService] Error in deleteProject:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[ProjectService] Falling back to file storage');
                return await this.fileService.deleteProject(idJira);
            }
            return false;
        }
    }

    async getProjectById(idJira: string): Promise<Project | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getProjectById(idJira)
                : await this.fileService.getProjectById(idJira);
                
            return result;
        } catch (error) {
            console.error(`[ProjectService] Error in getProjectById:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[ProjectService] Falling back to file storage');
                return await this.fileService.getProjectById(idJira);
            }
            return null;
        }
    }

    async updateProjectStatus(idJira: string, status: string): Promise<boolean> {
        return await this.updateProject(idJira, { 
            estado: status, 
            estadoCalculado: status 
        });
    }
}
