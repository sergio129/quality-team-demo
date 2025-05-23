import { Project } from '@/models/Project';
import { prisma } from '@/lib/prisma';

export class ProjectPrismaService {
    async getAllProjects(): Promise<Project[]> {
        try {
            const projects = await prisma.project.findMany({
                include: {
                    analysts: true
                }
            });
            
            return projects.map(project => ({
                id: project.id,
                idJira: project.idJira,
                proyecto: project.name,
                equipo: project.team,
                celula: project.cell,
                inicio: project.startDate?.toISOString() || '',
                fin: project.endDate?.toISOString() || '',
                progreso: project.progress,
                estado: project.status,
                analistas: project.analysts.map(a => a.analystId)
            }));
        } catch (error) {
            console.error('Error fetching projects from database:', error);
            throw error;
        }
    }

    async saveProject(project: Project): Promise<boolean> {
        try {
            await prisma.project.create({
                data: {
                    id: project.id || crypto.randomUUID(),
                    idJira: project.idJira,
                    name: project.proyecto,
                    team: project.equipo,
                    cell: project.celula,
                    startDate: project.inicio ? new Date(project.inicio) : null,
                    endDate: project.fin ? new Date(project.fin) : null,
                    progress: project.progreso || 0,
                    status: project.estado || 'En progreso',
                    analysts: {
                        create: project.analistas?.map(analystId => ({
                            analystId
                        })) || []
                    }
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error saving project to database:', error);
            return false;
        }
    }

    async updateProject(idJira: string, project: Partial<Project>): Promise<boolean> {
        try {
            const existingProject = await prisma.project.findUnique({
                where: { idJira }
            });
            
            if (!existingProject) {
                return false;
            }
            
            // Preparar los datos para actualizar
            const updateData: any = {};
            
            if (project.proyecto) updateData.name = project.proyecto;
            if (project.equipo) updateData.team = project.equipo;
            if (project.celula) updateData.cell = project.celula;
            if (project.inicio) updateData.startDate = new Date(project.inicio);
            if (project.fin) updateData.endDate = new Date(project.fin);
            if (project.progreso !== undefined) updateData.progress = project.progreso;
            if (project.estado) updateData.status = project.estado;
            
            // Actualizar proyecto
            await prisma.project.update({
                where: { idJira },
                data: updateData
            });
            
            // Si hay analistas para actualizar
            if (project.analistas) {
                // Eliminar relaciones existentes
                await prisma.projectAnalyst.deleteMany({
                    where: { projectId: existingProject.id }
                });
                
                // Crear nuevas relaciones
                if (project.analistas.length > 0) {
                    await prisma.projectAnalyst.createMany({
                        data: project.analistas.map(analystId => ({
                            projectId: existingProject.id,
                            analystId
                        }))
                    });
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error updating project ${idJira} in database:`, error);
            return false;
        }
    }

    async deleteProject(idJira: string): Promise<boolean> {
        try {
            const project = await prisma.project.findUnique({
                where: { idJira }
            });
            
            if (!project) {
                return false;
            }
            
            // Eliminar relaciones primero
            await prisma.projectAnalyst.deleteMany({
                where: { projectId: project.id }
            });
            
            // Eliminar proyecto
            await prisma.project.delete({
                where: { idJira }
            });
            
            return true;
        } catch (error) {
            console.error(`Error deleting project ${idJira} from database:`, error);
            return false;
        }
    }

    async getProjectById(idJira: string): Promise<Project | null> {
        try {
            const project = await prisma.project.findUnique({
                where: { idJira },
                include: {
                    analysts: true
                }
            });
            
            if (!project) {
                return null;
            }
            
            return {
                id: project.id,
                idJira: project.idJira,
                proyecto: project.name,
                equipo: project.team,
                celula: project.cell,
                inicio: project.startDate?.toISOString() || '',
                fin: project.endDate?.toISOString() || '',
                progreso: project.progress,
                estado: project.status,
                analistas: project.analysts.map(a => a.analystId)
            };
        } catch (error) {
            console.error(`Error fetching project ${idJira} from database:`, error);
            return null;
        }
    }
}
