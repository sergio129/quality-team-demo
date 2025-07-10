import { Project } from '@/models/Project';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { GetProjectsOptions } from '@/services/projectServiceTypes';

export class ProjectPrismaService {
    async getAllProjects(options?: GetProjectsOptions): Promise<Project[]> {
        try {
            // If user is QA Leader, return all projects
            if (options?.role === 'QA Leader' || !options?.analystId) {
                // Admin or no specific filter requested
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
                return this.mapProjects(projects);
            }
            
            // For QA Analyst or QA Senior, filter to only show their assigned projects
            const projects = await prisma.project.findMany({
                where: {
                    analysts: {
                        some: {
                            analystId: options.analystId
                        }
                    }
                },
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
            return this.mapProjects(projects);
        } catch (error) {
            console.error('Error fetching projects from database:', error);
            throw error;
        }
    }
    
    // Helper method to map Prisma projects to our Project model
    private mapProjects(projects: any[]): Project[] {
        return projects.map((project: any) => ({
            id: project.id,
            idJira: project.idJira,
            nombre: project.nombre || undefined,
            proyecto: project.proyecto,
            equipo: project.team?.name || project.equipoId,
            celula: project.cell?.name || project.celulaId,
            horas: project.horas || 0,
            dias: project.dias || 0,
            horasEstimadas: project.horasEstimadas || undefined,                
            estado: project.estado || this.calcularEstadoProyecto(project),
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
                horasEstimadas: project.horasEstimadas || undefined,                
                estado: project.estado || this.calcularEstadoProyecto(project),
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
            console.log(`[ProjectPrismaService] Guardando proyecto en base de datos: ${project.idJira}`);
            
            // Primero verificar que el equipo y la célula existan
            let equipoId = project.equipo;
            let celulaId = project.celula;
            
            try {
                // Buscar equipo por ID o nombre
                const team = await prisma.team.findFirst({
                    where: {
                        OR: [
                            { id: project.equipo },
                            { name: project.equipo }
                        ]
                    }
                });
                
                if (team) {
                    equipoId = team.id;
                    console.log(`[ProjectPrismaService] Equipo encontrado: ${team.name} (${team.id})`);
                } else {
                    console.error(`[ProjectPrismaService] Error: Equipo no encontrado: ${project.equipo}`);
                    return false;
                }
                
                // Buscar célula por ID o nombre
                const cell = await prisma.cell.findFirst({
                    where: {
                        OR: [
                            { id: project.celula },
                            { name: project.celula }
                        ]
                    }
                });
                
                if (cell) {
                    celulaId = cell.id;
                    console.log(`[ProjectPrismaService] Célula encontrada: ${cell.name} (${cell.id})`);
                } else {
                    console.error(`[ProjectPrismaService] Error: Célula no encontrada: ${project.celula}`);
                    return false;
                }
            } catch (lookupError) {
                console.error('[ProjectPrismaService] Error al buscar equipo/célula:', lookupError);
                return false;
            }
            
            // Construir datos del proyecto para la creación
            const projectData = {
                id: project.id || crypto.randomUUID(),
                idJira: project.idJira,
                nombre: project.nombre,
                proyecto: project.proyecto,
                equipoId: equipoId,
                celulaId: celulaId,
                horas: project.horas || 0,
                dias: project.dias || 0,
                horasEstimadas: project.horasEstimadas,
                estado: project.estado || 'pendiente',
                estadoCalculado: project.estadoCalculado || 'Por Iniciar',
                descripcion: project.descripcion,
                fechaInicio: project.fechaInicio,
                fechaFin: project.fechaFin,
                fechaEntrega: project.fechaEntrega,
                fechaRealEntrega: project.fechaRealEntrega,
                fechaCertificacion: project.fechaCertificacion,
                diasRetraso: project.diasRetraso || 0,
                analistaProducto: project.analistaProducto || '',
                planTrabajo: project.planTrabajo || ''
            };
            
            // Crear el proyecto primero
            const result = await prisma.project.create({
                data: projectData
            });
            
            // Agregar analistas si existen después de crear el proyecto
            if (project.analistas && Array.isArray(project.analistas) && project.analistas.length > 0) {
                // Crear las relaciones de los analistas con el proyecto
                await Promise.all(project.analistas.map(async (analystId) => {
                    return prisma.projectAnalyst.create({
                        data: {
                            projectId: result.id,
                            analystId
                        }
                    });
                }));
            }
            
            console.log(`[ProjectPrismaService] Proyecto creado correctamente con ID: ${result.id}`);
            return true;
        } catch (error) {
            console.error('[ProjectPrismaService] Error al guardar proyecto en la base de datos:', error);
            throw error;
        }
    }    
    
    async updateProject(idJira: string, project: Partial<Project>): Promise<boolean> {
        try {
            console.log(`[ProjectPrismaService] Iniciando actualización del proyecto ${idJira}`);
            
            if (!idJira) {
                console.error(`[ProjectPrismaService] Error: idJira es requerido para la actualización`);
                return false;
            }
            
            // Primero buscar el proyecto por idJira para obtener su ID interno
            const existingProject = await prisma.project.findFirst({
                where: { idJira }
            });
            
            if (!existingProject) {
                console.error(`[ProjectPrismaService] Proyecto con idJira ${idJira} no encontrado para actualizar`);
                return false;
            }
            
            console.log(`[ProjectPrismaService] Proyecto encontrado con id interno: ${existingProject.id}`);
            
            // Preparar los datos a actualizar
            const updateData: any = {};
            
            try {
                // Mapear los campos del modelo Project a los campos de Prisma
                if (project.idJira !== undefined) updateData.idJira = project.idJira;
                if (project.nombre !== undefined) updateData.nombre = project.nombre;
                if (project.proyecto !== undefined) updateData.proyecto = project.proyecto;
                
                // Asegurar que los campos numéricos sean números válidos
                if (project.horas !== undefined) updateData.horas = Number(project.horas) || 0;
                if (project.dias !== undefined) updateData.dias = Number(project.dias) || 0;
                if (project.diasRetraso !== undefined) updateData.diasRetraso = Number(project.diasRetraso) || 0;
                
                // Manejo especial para campos que pueden ser null
                if (project.horasEstimadas !== undefined) {
                    updateData.horasEstimadas = project.horasEstimadas !== null ? 
                        Number(project.horasEstimadas) || 0 : null;
                }
                
                // Campos de texto simples
                if (project.estado !== undefined) {
                    console.log(`[ProjectPrismaService] Actualizando estado de '${existingProject.estado || 'sin estado'}' a '${project.estado}'`);
                    updateData.estado = project.estado;
                }
                
                if (project.estadoCalculado !== undefined) {
                    console.log(`[ProjectPrismaService] Actualizando estadoCalculado de '${existingProject.estadoCalculado || 'sin estado'}' a '${project.estadoCalculado}'`);
                    updateData.estadoCalculado = project.estadoCalculado;
                }
                
                if (project.descripcion !== undefined) updateData.descripcion = project.descripcion;
                if (project.analistaProducto !== undefined) updateData.analistaProducto = project.analistaProducto;
                if (project.planTrabajo !== undefined) updateData.planTrabajo = project.planTrabajo;
                
                // Manejo seguro de fechas
                if (project.fechaInicio !== undefined) updateData.fechaInicio = project.fechaInicio;
                if (project.fechaFin !== undefined) updateData.fechaFin = project.fechaFin;
                if (project.fechaEntrega !== undefined) updateData.fechaEntrega = project.fechaEntrega;
                if (project.fechaRealEntrega !== undefined) updateData.fechaRealEntrega = project.fechaRealEntrega;
                if (project.fechaCertificacion !== undefined) updateData.fechaCertificacion = project.fechaCertificacion;
                
                // Actualizar referencias a equipo o célula
                if (project.equipo !== undefined) {
                    try {
                        const team = await prisma.team.findFirst({
                            where: {
                                OR: [
                                    { id: project.equipo },
                                    { name: project.equipo }
                                ]
                            }
                        });
                        
                        if (team) {
                            updateData.equipoId = team.id;
                            console.log(`[ProjectPrismaService] Usando equipo: ${team.name} (${team.id})`);
                        } else {
                            console.log(`[ProjectPrismaService] No se encontró el equipo: ${project.equipo}, manteniendo el actual`);
                            updateData.equipoId = existingProject.equipoId;
                        }
                    } catch (teamErr) {
                        console.error("[ProjectPrismaService] Error buscando equipo:", teamErr);
                        updateData.equipoId = existingProject.equipoId;
                    }
                }
                
                if (project.celula !== undefined) {
                    try {
                        const cell = await prisma.cell.findFirst({
                            where: {
                                OR: [
                                    { id: project.celula },
                                    { name: project.celula }
                                ]
                            }
                        });
                        
                        if (cell) {
                            updateData.celulaId = cell.id;
                            console.log(`[ProjectPrismaService] Usando célula: ${cell.name} (${cell.id})`);
                        } else {
                            console.log(`[ProjectPrismaService] No se encontró la célula: ${project.celula}, manteniendo la actual`);
                            updateData.celulaId = existingProject.celulaId;
                        }
                    } catch (cellErr) {
                        console.error("[ProjectPrismaService] Error buscando célula:", cellErr);
                        updateData.celulaId = existingProject.celulaId;
                    }
                }
                
                console.log(`[ProjectPrismaService] Datos a actualizar:`, updateData);
                
                // Verificar si hay datos para actualizar
                if (Object.keys(updateData).length === 0) {
                    console.log(`[ProjectPrismaService] No hay datos para actualizar en el proyecto ${idJira}`);
                    return true; // No hay nada que actualizar, pero no es un error
                }
                
                // Actualizar el proyecto usando el ID interno
                const result = await prisma.project.update({
                    where: { id: existingProject.id },
                    data: updateData
                });
                
                console.log(`[ProjectPrismaService] Proyecto ${idJira} actualizado correctamente:`, result.id);
                
                // Manejar los analistas si se proporcionaron
                if (project.analistas !== undefined) {
                    try {
                        // Eliminar todas las relaciones existentes
                        await prisma.projectAnalyst.deleteMany({
                            where: { projectId: existingProject.id }
                        });
                        
                        // Crear nuevas relaciones si hay analistas
                        const analistasArray = project.analistas;
                        if (Array.isArray(analistasArray) && analistasArray.length > 0) {
                            for (const analystId of analistasArray) {
                                try {
                                    // Primero verificar que el analista existe
                                    const analyst = await prisma.qAAnalyst.findUnique({
                                        where: { id: analystId }
                                    });
                                    
                                    if (analyst) {
                                        await prisma.projectAnalyst.create({
                                            data: {
                                                projectId: existingProject.id,
                                                analystId: analyst.id
                                            }
                                        });
                                    } else {
                                        console.log(`[ProjectPrismaService] Analista no encontrado: ${analystId}, omitiendo`);
                                    }
                                } catch (analystError) {
                                    console.error(`[ProjectPrismaService] Error al asignar el analista ${analystId}:`, analystError);
                                    // Continuar con el siguiente analista
                                }
                            }
                        }
                    } catch (analystErr) {
                        console.error('[ProjectPrismaService] Error al gestionar los analistas del proyecto:', analystErr);
                        // No propagamos el error para no bloquear la actualización principal
                    }
                }
                
                return true;
                
            } catch (error) {
                console.error(`[ProjectPrismaService] Error procesando datos del proyecto:`, error);
                throw error;
            }
            
        } catch (error) {
            console.error(`[ProjectPrismaService] Error updating project ${idJira}:`, error);
            throw error;
        }
    }    
    
    async deleteProject(idJira: string): Promise<boolean> {
        try {
            // Verificar si el proyecto existe y obtener su ID interno
            const project = await prisma.project.findFirst({
                where: { idJira }
            });
            
            if (!project) {
                console.log(`Project with idJira ${idJira} not found`);
                return false;
            }
            
            // Primero eliminar las relaciones con analistas
            await prisma.projectAnalyst.deleteMany({
                where: { projectId: project.id }
            });
            
            // Luego eliminar el proyecto
            await prisma.project.delete({
                where: { id: project.id }
            });
            
            console.log(`Project ${idJira} deleted successfully`);
            return true;
        } catch (error) {
            console.error(`Error deleting project ${idJira}:`, error);
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
        
        // Verificar si tiene fecha de certificación y es menor o igual a la fecha actual
        if (project.fechaCertificacion && new Date(project.fechaCertificacion) <= fechaActual) {
            return "Certificado";
        }
        
        // Verificar si ya ha iniciado
        if (project.fechaInicio && new Date(project.fechaInicio) <= fechaActual) {
            return "En Progreso";
        }
        
        // Por defecto
        return "Por Iniciar";
    }

    async getProjectById(idJiraOrId: string): Promise<Project | null> {
        try {
            // Buscar por idJira o id regular
            const project = await prisma.project.findFirst({
                where: {
                    OR: [
                        { idJira: idJiraOrId },
                        { id: idJiraOrId }
                    ]
                },
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

            if (!project) {
                return null;
            }

            return {
                id: project.id,
                idJira: project.idJira,
                nombre: project.nombre || undefined,
                proyecto: project.proyecto,
                equipo: project.team?.name || project.equipoId,
                celula: project.cell?.name || project.celulaId,
                horas: project.horas || 0,
                dias: project.dias || 0,
                horasEstimadas: project.horasEstimadas || undefined,                
                estado: project.estado || this.calcularEstadoProyecto(project),
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
            };
        } catch (error) {
            console.error('Error getting project by ID from database:', error);
            return null;
        }
    }
}
