import { Project } from '@/models/Project';
import { prisma } from '@/lib/prisma';

export class ProjectPrismaService {
    async getAllProjects(): Promise<Project[]> {
        try {
            const projects = await prisma.project.findMany({
                include: {
                    team: true,
                    cell: true,
                    analysts: {
                        include: {
                            analyst: true
                        }
                    }
                }
            });
              return projects.map((project: any) => ({
                id: project.id,
                idJira: project.idJira,
                nombre: project.nombre || undefined,
                proyecto: project.proyecto,
                equipo: project.team?.name || project.equipoId,
                celula: project.cell?.name || project.celulaId,
                horas: project.horas || 0,
                dias: project.dias || 0,
                horasEstimadas: project.horasEstimadas || undefined,                estado: project.estado || this.calcularEstadoProyecto(project),
                estadoCalculado: project.estadoCalculado as any || this.calcularEstadoCalculado(project),
                descripcion: project.descripcion || undefined,
                fechaInicio: project.fechaInicio || undefined,
                fechaFin: project.fechaFin || undefined,
                fechaEntrega: project.fechaEntrega,
                fechaRealEntrega: project.fechaRealEntrega || undefined,
                fechaCertificacion: project.fechaCertificacion || undefined,
                diasRetraso: project.diasRetraso,
                analistaProducto: project.analistaProducto,
                planTrabajo: project.planTrabajo,
                analistas: project.analysts.map((a: any) => a.analystId)
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
                    nombre: project.nombre,
                    proyecto: project.proyecto,
                    equipoId: project.equipo,
                    celulaId: project.celula,
                    horas: project.horas || 0,
                    dias: project.dias || 0,
                    horasEstimadas: project.horasEstimadas,
                    estado: project.estado,
                    estadoCalculado: project.estadoCalculado,
                    descripcion: project.descripcion,
                    fechaInicio: project.fechaInicio,
                    fechaFin: project.fechaFin,
                    fechaEntrega: project.fechaEntrega,
                    fechaRealEntrega: project.fechaRealEntrega,
                    fechaCertificacion: project.fechaCertificacion,
                    diasRetraso: project.diasRetraso || 0,
                    analistaProducto: project.analistaProducto,
                    planTrabajo: project.planTrabajo,
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
            throw error;
        }
    }

    async updateProject(id: string, project: Partial<Project>): Promise<boolean> {
        try {
            // Preparar los datos a actualizar
            const updateData: any = {};
            
            // Mapear los campos del modelo Project a los campos de Prisma
            if (project.idJira !== undefined) updateData.idJira = project.idJira;
            if (project.nombre !== undefined) updateData.nombre = project.nombre;
            if (project.proyecto !== undefined) updateData.proyecto = project.proyecto;
            if (project.horas !== undefined) updateData.horas = project.horas;
            if (project.dias !== undefined) updateData.dias = project.dias;
            if (project.horasEstimadas !== undefined) updateData.horasEstimadas = project.horasEstimadas;
            if (project.estado !== undefined) updateData.estado = project.estado;
            if (project.estadoCalculado !== undefined) updateData.estadoCalculado = project.estadoCalculado;
            if (project.descripcion !== undefined) updateData.descripcion = project.descripcion;
            if (project.fechaInicio !== undefined) updateData.fechaInicio = project.fechaInicio;
            if (project.fechaFin !== undefined) updateData.fechaFin = project.fechaFin;
            if (project.fechaEntrega !== undefined) updateData.fechaEntrega = project.fechaEntrega;
            if (project.fechaRealEntrega !== undefined) updateData.fechaRealEntrega = project.fechaRealEntrega;
            if (project.fechaCertificacion !== undefined) updateData.fechaCertificacion = project.fechaCertificacion;
            if (project.diasRetraso !== undefined) updateData.diasRetraso = project.diasRetraso;
            if (project.analistaProducto !== undefined) updateData.analistaProducto = project.analistaProducto;
            if (project.planTrabajo !== undefined) updateData.planTrabajo = project.planTrabajo;
            
            // Actualizar referencias a equipo o célula
            if (project.equipo !== undefined) updateData.equipoId = project.equipo;
            if (project.celula !== undefined) updateData.celulaId = project.celula;
            
            // Actualizar el proyecto
            await prisma.project.update({
                where: { id },
                data: updateData
            });
            
            // Si se proporcionan analistas, actualizar las relaciones
            if (project.analistas !== undefined) {
                // Eliminar todas las relaciones existentes
                await prisma.projectAnalyst.deleteMany({
                    where: { projectId: id }
                });
                
                // Crear nuevas relaciones si hay analistas
                if (project.analistas && project.analistas.length > 0) {
                    for (const analystId of project.analistas) {
                        await prisma.projectAnalyst.create({
                            data: {
                                project: { connect: { id } },
                                analyst: { connect: { id: analystId } }
                            }
                        });
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error updating project ${id}:`, error);
            throw error;
        }
    }

    async deleteProject(id: string): Promise<boolean> {
        try {
            // Verificar si el proyecto existe
            const project = await prisma.project.findUnique({
                where: { id }
            });
            
            if (!project) {
                return false;
            }
            
            // Primero eliminar las relaciones con analistas
            await prisma.projectAnalyst.deleteMany({
                where: { projectId: id }
            });
            
            // Luego eliminar el proyecto
            await prisma.project.delete({
                where: { id }
            });
            
            return true;
        } catch (error) {
            console.error(`Error deleting project ${id}:`, error);
            throw error;
        }
    }

    // Método para calcular el estado de un proyecto basado en fechas y otros atributos
    private calcularEstadoProyecto(project: any): string {
        // Si ya tiene un estado definido, usarlo
        if (project.estado) return project.estado;
        
        // Obtener la fecha actual
        const fechaActual = new Date();
        
        // Verificar si tiene fechaRealEntrega (proyecto finalizado)
        if (project.fechaRealEntrega) {
            return "finalizado";
        }
        
        // Verificar si tiene plan de trabajo
        if (project.planTrabajo && project.planTrabajo !== "") {
            if (project.planTrabajo.toLowerCase().includes("finaliza")) {
                return "finalizado";
            } 
            if (project.planTrabajo.toLowerCase().includes("prueba")) {
                return "pruebas";
            }
            if (project.planTrabajo.toLowerCase().includes("actualiza")) {
                return "actualizacion";
            }
            if (project.planTrabajo.toLowerCase().includes("proceso")) {
                return "En proceso";
            }
        }
        
        // Comprobar si está retrasado
        if (project.fechaEntrega && new Date(project.fechaEntrega) < fechaActual && !project.fechaRealEntrega) {
            return "retrasado";
        }
        
        // Comprobar si está en progreso
        if (project.fechaInicio && new Date(project.fechaInicio) <= fechaActual) {
            return "en progreso";
        }
        
        // Por defecto, si no podemos determinar el estado
        return "pendiente";
    }
    
    // Método para calcular el estado calculado del proyecto
    private calcularEstadoCalculado(project: any): 'Por Iniciar' | 'En Progreso' | 'Certificado' {
        // Si ya tiene un estado calculado definido, usarlo
        if (project.estadoCalculado) return project.estadoCalculado as any;
        
        // Obtener la fecha actual
        const fechaActual = new Date();
        
        // Verificar si tiene fecha de certificación
        if (project.fechaCertificacion) {
            return "Certificado";
        }
        
        // Verificar si ya ha iniciado
        if (project.fechaInicio && new Date(project.fechaInicio) <= fechaActual) {
            return "En Progreso";
        }
        
        // Por defecto
        return "Por Iniciar";
    }
}
