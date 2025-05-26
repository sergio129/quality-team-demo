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
    }    async saveProject(project: Project): Promise<boolean> {
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
    }    async updateProject(idJira: string, updatedProject: Partial<Project>): Promise<boolean> {
        try {
            console.log(`[ProjectService] Actualizando proyecto ${idJira}`, JSON.stringify(updatedProject, null, 2));
            
            // Validación básica de datos antes de continuar
            if (!idJira) {
                console.error('[ProjectService] Error: ID de Jira no proporcionado');
                return false;
            }
            
            if (!updatedProject || Object.keys(updatedProject).length === 0) {
                console.error('[ProjectService] Error: No hay datos para actualizar');
                return false;
            }
            
            // Para evitar errores de tipo con las fechas, realizamos una conversión explícita
            const projectToUpdate = { ...updatedProject };
            
            // Convertir fechas al formato adecuado para PostgreSQL
            if (projectToUpdate.fechaInicio) {
                projectToUpdate.fechaInicio = new Date(projectToUpdate.fechaInicio);
            }
            if (projectToUpdate.fechaFin) {
                projectToUpdate.fechaFin = new Date(projectToUpdate.fechaFin);
            }
            if (projectToUpdate.fechaEntrega) {
                projectToUpdate.fechaEntrega = new Date(projectToUpdate.fechaEntrega);
            }
            if (projectToUpdate.fechaRealEntrega) {
                projectToUpdate.fechaRealEntrega = new Date(projectToUpdate.fechaRealEntrega);
            }
            if (projectToUpdate.fechaCertificacion) {
                projectToUpdate.fechaCertificacion = new Date(projectToUpdate.fechaCertificacion);
            }
            
            // Convertir campos numéricos para evitar errores de tipo
            if (projectToUpdate.horas !== undefined) {
                projectToUpdate.horas = Number(projectToUpdate.horas);
            }
            if (projectToUpdate.dias !== undefined) {
                projectToUpdate.dias = Number(projectToUpdate.dias);
            }
            if (projectToUpdate.diasRetraso !== undefined) {
                projectToUpdate.diasRetraso = Number(projectToUpdate.diasRetraso);
            }
            if (projectToUpdate.horasEstimadas !== undefined) {
                projectToUpdate.horasEstimadas = projectToUpdate.horasEstimadas !== null ? 
                    Number(projectToUpdate.horasEstimadas) : null;
            }
            
            const result = this.usePostgres
                ? await this.prismaService.updateProject(idJira, projectToUpdate)
                : await this.fileService.updateProject(idJira, projectToUpdate);
                
            return result;
        } catch (error) {
            console.error(`[ProjectService] Error in updateProject:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[ProjectService] Falling back to file storage');
                try {
                    return await this.fileService.updateProject(idJira, updatedProject);
                } catch (fallbackError) {
                    console.error(`[ProjectService] Fallback error:`, fallbackError);
                    return false;
                }
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
    
    async updateProjectStatus(projectId: string, newStatus: string): Promise<boolean> {
        try {
            const project = await this.getProjectById(projectId);
            if (!project) return false;
            
            // Actualizar solo los campos de estado
            const updateData: Partial<Project> = {
                estado: newStatus,
                estadoCalculado: newStatus
            };
            
            // Si el estado es "Certificado" y no tiene fecha de certificación, establecerla
            if (newStatus === 'Certificado' && !project.fechaCertificacion) {
                updateData.fechaCertificacion = new Date().toISOString();
            }
            
            return await this.updateProject(projectId, updateData);
        } catch (error) {
            console.error(`[ProjectService] Error in updateProjectStatus:`, error);
            return false;
        }
    }
}

// Exportar una instancia del servicio para mantener compatibilidad con el código existente
export const projectService = new ProjectService();
