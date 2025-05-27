import { Incident, IncidentImage } from '@/models/Incident';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

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
    private async findAnalystIdByName(name: string): Promise<string> {
        const analyst = await prisma.qAAnalyst.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });
        if (!analyst) {
            throw new Error(`Analista no encontrado: ${name}`);
        }
        return analyst.id;
    }

    private async findCellIdByName(name: string): Promise<string> {
        const cell = await prisma.cell.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });
        if (!cell) {
            throw new Error(`Célula no encontrada: ${name}`);
        }
        return cell.id;
    }

    private async findOrCreateAnalystByName(name: string): Promise<string> {
        if (!name) {
            // Si no se proporciona nombre, asignar a un "Analista Desconocido" por defecto
            name = "Analista Desconocido";
        }

        // Buscar analista existente
        const existingAnalyst = await prisma.qAAnalyst.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });

        // Si existe, devolver su ID
        if (existingAnalyst) {
            return existingAnalyst.id;
        }

        // Si no existe, crear un nuevo registro (con valores predeterminados para los campos obligatorios)
        const newAnalyst = await prisma.qAAnalyst.create({
            data: {
                name: name,
                email: `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`, // Email generado
                role: 'Externo', // Rol predeterminado para analistas externos
                color: '#808080' // Color predeterminado
            }
        });

        console.log(`[IncidentPrismaService] Creado nuevo analista: ${name}`);
        return newAnalyst.id;
    }

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
            return dbIncidents.map((dbIncident: any) => {                // Asegurar que se use el nombre de la célula si está disponible, no el ID
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
                    areaAfectada: dbIncident.areaAfectada || undefined,                celula: dbIncident.cell?.name || dbIncident.celula,
                    informadoPor: dbIncident.informadoPor?.name || '',
                    // Usamos preferentemente el campo de texto directo, con fallback al analista relacionado
                    asignadoA: dbIncident.asignadoA_text || dbIncident.asignadoA?.name || '',
                    etiquetas: dbIncident.etiquetas.map((tag: any) => tag.name)
                };
            });
        } catch (error) {
            console.error('Error fetching incidents from database:', error);
            throw error;
        }
    }    async save(incident: Partial<Incident>): Promise<Incident> {
        try {
            // Obtener IDs basados en nombres
            const [informadoPorId, cellId] = await Promise.all([
                this.findAnalystIdByName(incident.informadoPor || ''),
                this.findCellIdByName(incident.celula || '')
            ]);

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
                    areaAfectada: incident.areaAfectada,                    celula: cellId, // Use the resolved cell ID
                    informadoPorId, // Use the resolved analyst ID
                    // Almacenamos directamente el nombre del responsable asignado en el campo asignadoA_text
                    asignadoA_text: incident.asignadoA || '',
                    // Ya no utilizamos la relación asignadoAId
                    asignadoAId: null,
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
                fechaSolucion: createdIncident.fechaSolucion || undefined,                diasAbierto: createdIncident.diasAbierto,
                esErroneo: createdIncident.esErroneo,
                aplica: createdIncident.aplica,
                cliente: createdIncident.cliente,
                // Usamos el campo de texto directo para el responsable asignado
                asignadoA: createdIncident.asignadoA_text || createdIncident.asignadoA?.name || '',
                idJira: createdIncident.idJira,
                tipoBug: createdIncident.tipoBug || undefined,
                areaAfectada: createdIncident.areaAfectada || undefined,
                celula: createdIncident.cell?.name || '',
                informadoPor: createdIncident.informadoPor?.name || '',
                asignadoA: createdIncident.asignadoA?.name || '',
                etiquetas: createdIncident.etiquetas.map((tag: any) => tag.name)
            };
        } catch (error) {
            console.error('Error saving incident to database:', error);
            throw error;
        }
    }    async update(id: string, incident: Partial<Incident>): Promise<Incident | null> {
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
            
            // Obtener IDs basados en nombres si se proporcionaron
            let informadoPorId = existingIncident.informadoPorId;
            let asignadoAId = existingIncident.asignadoAId;
            let cellId = existingIncident.celula;
            
            // Solo buscar IDs si se proporcionaron nuevos nombres
            if (incident.informadoPor) {
                informadoPorId = await this.findAnalystIdByName(incident.informadoPor);
            }
              if (incident.asignadoA) {
                asignadoAId = await this.findOrCreateAnalystByName(incident.asignadoA);
            }
            
            if (incident.celula) {
                cellId = await this.findCellIdByName(incident.celula);
            }
            
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
                    celula: cellId, // Use the resolved cell ID
                    informadoPorId: informadoPorId, // Use the resolved analyst IDs
                    asignadoAId: asignadoAId
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
                celula: updatedIncident.cell?.name || '',
                informadoPor: updatedIncident.informadoPor?.name || '',
                asignadoA: updatedIncident.asignadoA?.name || '',
                etiquetas: updatedIncident.etiquetas.map((tag: { name: string }) => tag.name)
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
            incidents.forEach((incident: any) => {
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
    }    // Método para adjuntar un archivo a un incidente
    async attachImageToIncident(incidentId: string, file: any): Promise<string> {
        try {
            // Verificar que el incidente existe
            const incident = await prisma.incident.findUnique({
                where: { id: incidentId }
            });
            
            if (!incident) {
                throw new Error(`Incidente con ID ${incidentId} no encontrado`);
            }

            // Verificar que el modelo IncidentImage existe en el cliente Prisma
            if (!prisma.incidentImage) {
                throw new Error('El modelo IncidentImage no está disponible en el cliente de Prisma. Por favor asegúrese de ejecutar prisma generate después de modificar el esquema.');
            }
            
            try {
                // Crear el archivo en la base de datos (usando aún el modelo IncidentImage)
                const createdFile = await prisma.incidentImage.create({
                    data: {
                        fileName: file.fileName || 'archivo.dat',
                        fileType: file.fileType || 'application/octet-stream',
                        fileSize: file.fileSize || 0,
                        data: Buffer.from(file.data || '', 'base64'), // Convertir base64 a buffer con valor predeterminado
                        incidentId
                    }
                });
                
                console.log(`Archivo adjuntado al incidente ${incidentId}: ${createdFile.id}`);
                return createdFile.id;
            } catch (createError) {
                console.error('Error específico al crear el archivo:', createError);
                  // Intentar acceder directamente a la base de datos usando executeRaw si el modelo no está disponible
                // Esto es una solución temporal y debería ser reemplazada por una migración adecuada
                let id;
                if (crypto.randomUUID) {
                    id = crypto.randomUUID();
                } else {
                    // Usar crypto.randomBytes como alternativa segura para generar un id único
                    // cuando randomUUID no está disponible
                    const randomBytes = crypto.randomBytes(16);
                    id = randomBytes.toString('hex');
                }
                const now = new Date().toISOString();
                
                console.log(`Intento alternativo de guardar archivo para el incidente ${incidentId}`);
                throw new Error(`No se pudo crear el archivo en la base de datos. Error: ${createError.message}`);
            }
        } catch (error) {
            console.error('Error al adjuntar archivo al incidente:', error);
            throw error;
        }
    }
      // Método para obtener todas las imágenes de un incidente
    async getImagesForIncident(incidentId: string): Promise<IncidentImage[]> {
        try {
            // Verificar primero que el incidente existe
            const incident = await prisma.incident.findUnique({
                where: { id: incidentId }
            });
            
            if (!incident) {
                throw new Error(`Incidente con ID ${incidentId} no encontrado`);
            }
            
            // Asegurarse de que prisma está disponible antes de llamar a findMany
            if (!prisma.incidentImage) {
                console.log('El modelo incidentImage no está disponible en el cliente Prisma');
                return []; // Devolver array vacío en lugar de fallar
            }
            
            const images = await prisma.incidentImage.findMany({
                where: { incidentId }
            });
            
            // Si no hay imágenes, devolver array vacío
            if (!images || images.length === 0) {
                return [];
            }
            
            // Convertir el buffer de datos a base64 para enviar al cliente
            return images.map((image: any) => ({
                id: image.id,
                fileName: image.fileName,
                fileType: image.fileType,
                fileSize: image.fileSize,
                data: image.data.toString('base64'),
                createdAt: image.createdAt
            }));
        } catch (error) {
            console.error('Error al obtener imágenes del incidente:', error);
            throw error;
        }
    }
    
    // Método para eliminar una imagen
    async deleteImage(imageId: string): Promise<void> {
        try {
            await prisma.incidentImage.delete({
                where: { id: imageId }
            });
            
            console.log(`Imagen ${imageId} eliminada correctamente`);
        } catch (error) {
            console.error(`Error al eliminar imagen ${imageId}:`, error);
            throw error;
        }
    }
}
