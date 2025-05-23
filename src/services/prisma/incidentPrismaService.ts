import { Incident } from '@/models/Incident';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface IncidentStats {
    totalPorCliente: { [key: string]: number };
    totalPorPrioridad: {
        Alta: number;
        Media: number;
        Baja: number;
    };
    totalAbiertas: number;
}

function calculateDaysOpen(fechaCreacion: Date, fechaSolucion?: Date): number {
    const start = new Date(fechaCreacion);
    const end = fechaSolucion ? new Date(fechaSolucion) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export class IncidentPrismaService {
    async getAll(): Promise<Incident[]> {
        try {
            const dbIncidents = await prisma.incident.findMany({
                include: {
                    cell: true,
                    informadoPor: true,
                    asignadoA: true,
                    etiquetas: true
                }
            });
            
            // Transformar desde formato DB a formato de aplicación
            return dbIncidents.map(dbIncident => {
                return {
                    id: dbIncident.id,
                    estado: dbIncident.estado,
                    prioridad: dbIncident.prioridad,
                    descripcion: dbIncident.descripcion,
                    fechaCreacion: dbIncident.fechaCreacion,
                    fechaReporte: dbIncident.fechaReporte,
                    fechaSolucion: dbIncident.fechaSolucion || undefined,
                    diasAbierto: calculateDaysOpen(dbIncident.fechaCreacion, dbIncident.fechaSolucion || undefined),
                    esErroneo: dbIncident.esErroneo,
                    aplica: dbIncident.aplica,
                    cliente: dbIncident.cliente,
                    idJira: dbIncident.idJira,
                    tipoBug: dbIncident.tipoBug || undefined,
                    areaAfectada: dbIncident.areaAfectada || undefined,
                    celula: dbIncident.celula,
                    informadoPorId: dbIncident.informadoPorId,
                    asignadoAId: dbIncident.asignadoAId,
                    etiquetas: dbIncident.etiquetas.map(tag => tag.name)
                };
            });
        } catch (error) {
            console.error('Error fetching incidents from database:', error);
            throw error;
        }
    }

    async save(incident: Partial<Incident>): Promise<Incident> {
        try {
            // Generar ID único con el formato INC-YYYYMMDD-XXX
            const today = new Date();
            const dateStr = today.toISOString().slice(0,10).replace(/-/g,'');
            
            // Buscar incidentes con el mismo formato de ID para ese día
            const latestIncidents = await prisma.incident.findMany({
                where: {
                    id: {
                        startsWith: `INC-${dateStr}`
                    }
                },
                orderBy: {
                    id: 'desc'
                },
                take: 1
            });
            
            let sequence = 1;
            if (latestIncidents.length > 0) {
                const parts = latestIncidents[0].id.split('-');
                if (parts.length === 3) {
                    sequence = parseInt(parts[2]) + 1;
                }
            }
            
            const newId = `INC-${dateStr}-${String(sequence).padStart(3, '0')}`;
            
            // Crear incidente en la base de datos
            const etiquetas = incident.etiquetas || [];
            
            const createdIncident = await prisma.incident.create({
                data: {
                    id: newId,
                    estado: incident.estado || 'Abierto',
                    prioridad: incident.prioridad || 'Media',
                    descripcion: incident.descripcion || '',
                    fechaCreacion: incident.fechaCreacion || new Date(),
                    fechaReporte: incident.fechaReporte || new Date(),
                    fechaSolucion: incident.fechaSolucion,
                    diasAbierto: calculateDaysOpen(
                        incident.fechaCreacion || new Date(),
                        incident.fechaSolucion
                    ),
                    esErroneo: incident.esErroneo || false,
                    aplica: incident.aplica !== undefined ? incident.aplica : true,
                    cliente: incident.cliente || '',
                    idJira: incident.idJira || '',
                    tipoBug: incident.tipoBug,
                    areaAfectada: incident.areaAfectada,
                    celula: incident.celula || '',
                    informadoPorId: incident.informadoPorId || '',
                    asignadoAId: incident.asignadoAId || '',
                    etiquetas: {
                        create: etiquetas.map(tag => ({
                            name: tag
                        }))
                    }
                },
                include: {
                    etiquetas: true,
                    cell: true,
                    informadoPor: true,
                    asignadoA: true
                }
            });
            
            // Convertir a formato de aplicación
            return {
                id: createdIncident.id,
                estado: createdIncident.estado,
                prioridad: createdIncident.prioridad,
                descripcion: createdIncident.descripcion,
                fechaCreacion: createdIncident.fechaCreacion,
                fechaReporte: createdIncident.fechaReporte,
                fechaSolucion: createdIncident.fechaSolucion || undefined,
                diasAbierto: createdIncident.diasAbierto,
                esErroneo: createdIncident.esErroneo,
                aplica: createdIncident.aplica,
                cliente: createdIncident.cliente,
                idJira: createdIncident.idJira,
                tipoBug: createdIncident.tipoBug || undefined,
                areaAfectada: createdIncident.areaAfectada || undefined,
                celula: createdIncident.celula,
                informadoPorId: createdIncident.informadoPorId,
                asignadoAId: createdIncident.asignadoAId,
                etiquetas: createdIncident.etiquetas.map(tag => tag.name)
            };
        } catch (error) {
            console.error('Error saving incident to database:', error);
            throw error;
        }
    }

    async update(id: string, incident: Partial<Incident>): Promise<Incident | null> {
        try {
            // Verificar si el incidente existe
            const existingIncident = await prisma.incident.findUnique({
                where: { id },
                include: { etiquetas: true }
            });
            
            if (!existingIncident) {
                return null;
            }
            
            // Actualizar etiquetas si es necesario
            if (incident.etiquetas) {
                // Eliminar etiquetas actuales
                await prisma.tag.deleteMany({
                    where: { incidentId: id }
                });
                
                // Crear nuevas etiquetas
                await Promise.all(incident.etiquetas.map(async (tagName) => {
                    await prisma.tag.create({
                        data: {
                            name: tagName,
                            incidentId: id
                        }
                    });
                }));
            }
            
            // Calcular días abiertos
            const fechaCreacion = incident.fechaCreacion || existingIncident.fechaCreacion;
            const fechaSolucion = incident.fechaSolucion;
            const diasAbierto = calculateDaysOpen(fechaCreacion, fechaSolucion);
            
            // Actualizar incidente
            const updatedIncident = await prisma.incident.update({
                where: { id },
                data: {
                    estado: incident.estado,
                    prioridad: incident.prioridad,
                    descripcion: incident.descripcion,
                    fechaCreacion: fechaCreacion,
                    fechaReporte: incident.fechaReporte,
                    fechaSolucion: fechaSolucion,
                    diasAbierto: diasAbierto,
                    esErroneo: incident.esErroneo,
                    aplica: incident.aplica,
                    cliente: incident.cliente,
                    idJira: incident.idJira,
                    tipoBug: incident.tipoBug,
                    areaAfectada: incident.areaAfectada,
                    celula: incident.celula,
                    informadoPorId: incident.informadoPorId,
                    asignadoAId: incident.asignadoAId
                },
                include: {
                    etiquetas: true,
                    cell: true,
                    informadoPor: true,
                    asignadoA: true
                }
            });
            
            // Convertir a formato de aplicación
            return {
                id: updatedIncident.id,
                estado: updatedIncident.estado,
                prioridad: updatedIncident.prioridad,
                descripcion: updatedIncident.descripcion,
                fechaCreacion: updatedIncident.fechaCreacion,
                fechaReporte: updatedIncident.fechaReporte,
                fechaSolucion: updatedIncident.fechaSolucion || undefined,
                diasAbierto: updatedIncident.diasAbierto,
                esErroneo: updatedIncident.esErroneo,
                aplica: updatedIncident.aplica,
                cliente: updatedIncident.cliente,
                idJira: updatedIncident.idJira,
                tipoBug: updatedIncident.tipoBug || undefined,
                areaAfectada: updatedIncident.areaAfectada || undefined,
                celula: updatedIncident.celula,
                informadoPorId: updatedIncident.informadoPorId,
                asignadoAId: updatedIncident.asignadoAId,
                etiquetas: updatedIncident.etiquetas.map(tag => tag.name)
            };
        } catch (error) {
            console.error('Error updating incident in database:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            // Primero eliminar etiquetas relacionadas
            await prisma.tag.deleteMany({
                where: { incidentId: id }
            });
            
            // Luego eliminar historial de estados si existe
            await prisma.stateChange.deleteMany({
                where: { incidentId: id }
            });
            
            // Eliminar relaciones con casos de prueba si existen
            await prisma.defectRelation.deleteMany({
                where: { incidentId: id }
            });
            
            // Finalmente eliminar el incidente
            await prisma.incident.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting incident from database:', error);
            throw error;
        }
    }
    
    async getStats(): Promise<IncidentStats> {
        try {
            // Obtener incidentes abiertos
            const incidents = await prisma.incident.findMany();
            
            // Inicializar las estadísticas
            const stats: IncidentStats = {
                totalPorCliente: {},
                totalPorPrioridad: {
                    Alta: 0,
                    Media: 0,
                    Baja: 0
                },
                totalAbiertas: 0
            };
            
            // Calcular estadísticas
            incidents.forEach((incident) => {
                // Contar por cliente
                if (!stats.totalPorCliente[incident.cliente]) {
                    stats.totalPorCliente[incident.cliente] = 0;
                }
                stats.totalPorCliente[incident.cliente]++;
                
                // Contar por prioridad y estado
                if (!incident.fechaSolucion && incident.estado !== 'Resuelto') {
                    if (incident.prioridad === 'Alta' || incident.prioridad === 'Media' || incident.prioridad === 'Baja') {
                        stats.totalPorPrioridad[incident.prioridad as keyof typeof stats.totalPorPrioridad]++;
                    }
                    stats.totalAbiertas++;
                }
            });
            
            return stats;
        } catch (error) {
            console.error('Error getting incident stats from database:', error);
            throw error;
        }
    }
}
