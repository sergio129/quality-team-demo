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
    }    async updateProject(idJira: string, project: Partial<Project>): Promise<boolean> {
        try {
            console.log(`[ProjectPrismaService] Iniciando actualización del proyecto ${idJira}`);
            
            // Primero buscar el proyecto por idJira para obtener su ID interno
            const existingProject = await prisma.project.findFirst({
                where: { idJira }
            });
            
            if (!existingProject) {
                console.log(`[ProjectPrismaService] Project with idJira ${idJira} not found for update`);
                return false;
            }
            
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
                if (project.estado !== undefined) updateData.estado = project.estado;
                if (project.estadoCalculado !== undefined) updateData.estadoCalculado = project.estadoCalculado;
                if (project.descripcion !== undefined) updateData.descripcion = project.descripcion;
                if (project.analistaProducto !== undefined) updateData.analistaProducto = project.analistaProducto;
                if (project.planTrabajo !== undefined) updateData.planTrabajo = project.planTrabajo;
                
                // Manejo seguro de fechas
                // La conversión a Date ya debería estar hecha en el servicio llamante
                if (project.fechaInicio !== undefined) updateData.fechaInicio = project.fechaInicio;
                if (project.fechaFin !== undefined) updateData.fechaFin = project.fechaFin;
                if (project.fechaEntrega !== undefined) updateData.fechaEntrega = project.fechaEntrega;
                if (project.fechaRealEntrega !== undefined) updateData.fechaRealEntrega = project.fechaRealEntrega;
                if (project.fechaCertificacion !== undefined) updateData.fechaCertificacion = project.fechaCertificacion;
                
                // Actualizar referencias a equipo o célula
                if (project.equipo !== undefined) {
                    // Verificar si es un ID o un nombre
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
                            // Si no se encuentra, mantener el valor original
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
                            console.log(`[ProjectPrismaService] Usando célula: ${cell.name} (${cell.id})`);
                        } else {
                            // Si no se encuentra, mantener el valor original
                            console.log(`[ProjectPrismaService] No se encontró la célula: ${project.celula}, manteniendo la actual`);
                            updateData.celulaId = existingProject.celulaId;
                        }
                    } catch (cellErr) {
                        console.error("[ProjectPrismaService] Error buscando célula:", cellErr);
                        updateData.celulaId = existingProject.celulaId;
                    }
                }
                
                console.log(`[ProjectPrismaService] Datos a actualizar:`, updateData);
                
                // Actualizar el proyecto usando el ID interno
                await prisma.project.update({
                    where: { id: existingProject.id },
                    data: updateData
                });
                
                console.log(`[ProjectPrismaService] Proyecto ${idJira} actualizado correctamente`);
            } catch (dataErr) {
                console.error(`[ProjectPrismaService] Error procesando datos del proyecto:`, dataErr);
                throw dataErr;
            }
            
            // Si se proporcionan analistas, actualizar las relaciones
            if (project.analistas !== undefined) {
                try {
                    // Eliminar todas las relaciones existentes
                    await prisma.projectAnalyst.deleteMany({
                        where: { projectId: existingProject.id }
                    });
                    
                    // Crear nuevas relaciones si hay analistas
                    if (project.analistas && Array.isArray(project.analistas) && project.analistas.length > 0) {
                        for (const analystId of project.analistas) {
                            try {
                                // Primero verificar que el analista existe
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
                                } else {
                                    console.log(`[ProjectPrismaService] Analista no encontrado: ${analystId}, omitiendo`);
                                }
                            } catch (e) {
                                console.error(`[ProjectPrismaService] Error al vincular analista ${analystId}:`, e);
                                // Continuar con el siguiente analista
                            }
                        }
                    }
                } catch (analysterr) {
                    console.error(`[ProjectPrismaService] Error actualizando analistas:`, analysterr);
                    // No fallamos la operación completa por los analistas
                }
            }
            
            return true;
        } catch (error) {
            console.error(`[ProjectPrismaService] Error updating project ${idJira}:`, error);
            throw error;
        }
    }    async deleteProject(idJira: string): Promise<boolean> {
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
}
