import { Project } from '@/models/Project';
import { prisma } from '@/lib/prisma';

/**
 * Versión debug del ProjectPrismaService con mejor manejo de errores
 * y logs más detallados para identificar problemas
 */
export class ProjectPrismaServiceDebug {
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

    /**
     * Actualiza un proyecto existente por su idJira
     * @param idJira ID de Jira del proyecto a actualizar
     * @param project Datos del proyecto a actualizar
     */
    async updateProject(idJira: string, project: Partial<Project>): Promise<boolean> {
        try {
            console.log(`[DEBUG] Iniciando actualización del proyecto ${idJira}`);
            console.log(`[DEBUG] Datos recibidos:`, JSON.stringify(project, null, 2));
            
            // Primero buscar el proyecto por idJira para obtener su ID interno
            const existingProject = await prisma.project.findFirst({
                where: { idJira },
                include: {
                    team: true,
                    cell: true,
                    analysts: true
                }
            });
            
            if (!existingProject) {
                console.log(`[DEBUG] ❌ Proyecto con idJira ${idJira} no encontrado`);
                return false;
            }
            
            console.log(`[DEBUG] ✅ Proyecto encontrado: ${existingProject.id}`);
            
            // Preparar los datos a actualizar con manejo seguro de campos
            const updateData: any = {};
            
            // Campos de texto y números
            if (project.idJira !== undefined) updateData.idJira = project.idJira;
            if (project.nombre !== undefined) updateData.nombre = project.nombre;
            if (project.proyecto !== undefined) updateData.proyecto = project.proyecto;
            if (project.horas !== undefined) updateData.horas = Number(project.horas);
            if (project.dias !== undefined) updateData.dias = Number(project.dias);
            if (project.horasEstimadas !== undefined) updateData.horasEstimadas = project.horasEstimadas !== null ? Number(project.horasEstimadas) : null;
            if (project.estado !== undefined) updateData.estado = project.estado;
            if (project.estadoCalculado !== undefined) updateData.estadoCalculado = project.estadoCalculado;
            if (project.descripcion !== undefined) updateData.descripcion = project.descripcion;
            if (project.diasRetraso !== undefined) updateData.diasRetraso = Number(project.diasRetraso);
            if (project.analistaProducto !== undefined) updateData.analistaProducto = project.analistaProducto;
            if (project.planTrabajo !== undefined) updateData.planTrabajo = project.planTrabajo;
            
            // Manejo seguro de fechas
            try {
                // Convertir fechas al formato adecuado para PostgreSQL
                if (project.fechaInicio !== undefined) {
                    updateData.fechaInicio = project.fechaInicio ? new Date(project.fechaInicio) : null;
                }
                if (project.fechaFin !== undefined) {
                    updateData.fechaFin = project.fechaFin ? new Date(project.fechaFin) : null;
                }
                if (project.fechaEntrega !== undefined) {
                    updateData.fechaEntrega = new Date(project.fechaEntrega);
                }
                if (project.fechaRealEntrega !== undefined) {
                    updateData.fechaRealEntrega = project.fechaRealEntrega ? new Date(project.fechaRealEntrega) : null;
                }
                if (project.fechaCertificacion !== undefined) {
                    updateData.fechaCertificacion = project.fechaCertificacion ? new Date(project.fechaCertificacion) : null;
                }
            } catch (dateError) {
                console.error(`[DEBUG] ❌ Error procesando fechas:`, dateError);
                return false;
            }
            
            // Manejo seguro de relaciones
            try {
                // Buscar IDs existentes de equipo y célula si se proporcionan nombres
                if (project.equipo !== undefined) {
                    // Verificar si es un ID o un nombre
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
                        console.log(`[DEBUG] ✅ Equipo encontrado: ${team.name} (${team.id})`);
                    } else {
                        console.log(`[DEBUG] ⚠️ Equipo no encontrado: ${project.equipo}`);
                    }
                }
                
                if (project.celula !== undefined) {
                    // Verificar si es un ID o un nombre
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
                        console.log(`[DEBUG] ✅ Célula encontrada: ${cell.name} (${cell.id})`);
                    } else {
                        console.log(`[DEBUG] ⚠️ Célula no encontrada: ${project.celula}`);
                    }
                }
            } catch (relError) {
                console.error(`[DEBUG] ❌ Error procesando relaciones:`, relError);
                // Continuamos con la actualización aunque fallen las relaciones
            }
            
            console.log(`[DEBUG] Datos preparados para actualizar:`, updateData);
            
            // Actualizar el proyecto usando el ID interno
            await prisma.project.update({
                where: { id: existingProject.id },
                data: updateData
            });
            
            // Si se proporcionan analistas, actualizar las relaciones
            if (project.analistas !== undefined) {
                try {
                    console.log(`[DEBUG] Actualizando analistas: ${project.analistas.length} analistas`);
                    
                    // Eliminar todas las relaciones existentes
                    await prisma.projectAnalyst.deleteMany({
                        where: { projectId: existingProject.id }
                    });
                    
                    // Crear nuevas relaciones si hay analistas
                    if (project.analistas && project.analistas.length > 0) {
                        for (const analystId of project.analistas) {
                            // Verificar que el analista existe
                            const analyst = await prisma.qAAnalyst.findUnique({
                                where: { id: analystId }
                            });
                            
                            if (analyst) {
                                await prisma.projectAnalyst.create({
                                    data: {
                                        project: { connect: { id: existingProject.id } },
                                        analyst: { connect: { id: analystId } }
                                    }
                                });
                                console.log(`[DEBUG] ✅ Analista ${analystId} vinculado al proyecto`);
                            } else {
                                console.log(`[DEBUG] ⚠️ Analista ${analystId} no encontrado, no se vinculará`);
                            }
                        }
                    }
                } catch (analystsError) {
                    console.error(`[DEBUG] ❌ Error procesando analistas:`, analystsError);
                    // Continuamos aunque fallen los analistas
                }
            }
            
            console.log(`[DEBUG] ✅ Proyecto ${idJira} actualizado correctamente`);
            return true;
        } catch (error) {
            console.error(`[DEBUG] ❌ Error actualizando proyecto ${idJira}:`, error);
            throw error;
        }
    }

    /**
     * Calcula el estado de un proyecto
     */
    calcularEstadoProyecto(project: any): string {
        const now = new Date();
        const fechaEntrega = project.fechaEntrega ? new Date(project.fechaEntrega) : null;
        
        if (!fechaEntrega) {
            return "Por Iniciar";
        }
        
        if (project.estado) {
            return project.estado;
        }
        
        // Si se recibió un estadoCalculado, lo usamos
        if (project.estadoCalculado) {
            return project.estadoCalculado;
        }
        
        // Si ya pasó la fecha de entrega, está certificado
        if (fechaEntrega < now) {
            return "Certificado";
        }
        
        // Si falta menos de una semana para la fecha de entrega
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if ((fechaEntrega.getTime() - now.getTime()) < oneWeek) {
            return "En Progreso";
        }
        
        return "Por Iniciar";
    }

    /**
     * Calcula el estado calculado de un proyecto
     */
    calcularEstadoCalculado(project: any): string {
        if (project.estadoCalculado) {
            return project.estadoCalculado;
        }
        return this.calcularEstadoProyecto(project);
    }
}
