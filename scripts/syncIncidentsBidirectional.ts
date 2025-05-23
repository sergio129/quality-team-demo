/**
 * Script para sincronizar incidentes entre archivos y PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Ruta al archivo de incidentes
const DATA_FOLDER = path.join(process.cwd(), 'data');
const INCIDENTS_FILE = path.join(DATA_FOLDER, 'incidents.txt');

/**
 * Lee un archivo JSON
 */
async function readJsonFile(filePath: string): Promise<any[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error);
    return [];
  }
}

/**
 * Escribe datos en un archivo JSON
 */
async function writeJsonFile(filePath: string, data: any[]): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error escribiendo ${filePath}:`, error);
    throw error;
  }
}

/**
 * Sincronizar incidentes entre archivos y PostgreSQL
 * SINCRONIZACIÓN BIDIRECCIONAL COMPLETA:
 * - Archivos -> PostgreSQL (nuevos incidentes)
 * - PostgreSQL -> Archivos (actualizaciones y eliminaciones)
 */
export async function syncIncidents(): Promise<void> {
  console.log('Sincronizando incidentes (bidireccional)...');
  
  // Obtener datos de archivos
  const fileIncidents = await readJsonFile(INCIDENTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbIncidents = await prisma.incident.findMany({
    include: {
      informadoPor: true,
      asignadoA: true,
      cell: true
    }
  });
  
  // Mapear IDs para comparación rápida
  const dbIncidentIds = new Set(dbIncidents.map((i: any) => i.id));
  const fileIncidentIds = new Set(fileIncidents.map((i: any) => i.id));
  
  // === PASO 1: Archivos -> PostgreSQL (nuevos incidentes) ===
  let newIncidentsCount = 0;
  for (const fileIncident of fileIncidents) {
    if (!dbIncidentIds.has(fileIncident.id)) {
      // Buscar IDs de analistas por nombre
      let informedById = null;
      let assignedToId = null;
      
      if (fileIncident.informadoPor) {
        const informer = await prisma.qAAnalyst.findFirst({
          where: {
            name: {
              contains: fileIncident.informadoPor.trim()
            }
          }
        });
        if (informer) {
          informedById = informer.id;
        }
      }
      
      if (fileIncident.asignadoA) {
        const assignee = await prisma.qAAnalyst.findFirst({
          where: {
            name: {
              contains: fileIncident.asignadoA.trim()
            }
          }
        });
        if (assignee) {
          assignedToId = assignee.id;
        }
      }
      
      // Buscar ID de célula por nombre
      let cellId = null;
      if (fileIncident.celula) {
        const cell = await prisma.cell.findFirst({
          where: {
            name: {
              contains: fileIncident.celula.trim()
            }
          }
        });
        if (cell) {
          cellId = cell.id;
        }
      }
      
      // Crear el incidente en PostgreSQL
      try {
        await prisma.incident.create({
          data: {
            id: fileIncident.id,
            estado: fileIncident.estado,
            prioridad: fileIncident.prioridad,
            descripcion: fileIncident.descripcion,
            fechaReporte: fileIncident.fechaReporte ? new Date(fileIncident.fechaReporte) : new Date(),
            fechaCreacion: fileIncident.fechaCreacion ? new Date(fileIncident.fechaCreacion) : new Date(),
            fechaSolucion: fileIncident.fechaSolucion ? new Date(fileIncident.fechaSolucion) : null,
            aplica: fileIncident.aplica ?? true,
            diasAbierto: fileIncident.diasAbierto || 0,
            esErroneo: fileIncident.esErroneo || false,
            cliente: fileIncident.cliente || '',
            idJira: fileIncident.idJira || '',
            tipoBug: fileIncident.tipoBug || null,
            areaAfectada: fileIncident.areaAfectada || null,
            
            // Relaciones
            celula: cellId || '',
            informadoPorId: informedById || '',
            asignadoAId: assignedToId || ''
          }
        });
        
        newIncidentsCount++;
      } catch (error) {
        console.error(`Error al migrar el incidente ${fileIncident.id}:`, error);
      }
    }
  }
  
  // === PASO 2: PostgreSQL -> Archivos (eliminaciones) ===
  // Identificar incidentes que están en archivos pero ya no en PostgreSQL
  const incidentsToDeleteFromFile = fileIncidents.filter((fileIncident: any) => 
    !dbIncidentIds.has(fileIncident.id)
  );
  
  let deletedFromFileCount = 0;
  if (incidentsToDeleteFromFile.length > 0) {
    console.log(`🗑️  Se encontraron ${incidentsToDeleteFromFile.length} incidentes para eliminar del archivo`);
    
    for (const incidentToDelete of incidentsToDeleteFromFile) {
      console.log(`🗑️  Eliminando incidente ${incidentToDelete.id} del archivo`);
      deletedFromFileCount++;
    }
  }

  // === PASO 3: Sincronizar archivos con estado actual de PostgreSQL ===
  // Transformar los incidentes de PostgreSQL al formato de la aplicación para actualizar los archivos
  const formattedDbIncidents = dbIncidents.map((incident: any) => ({
    id: incident.id,
    estado: incident.estado,
    prioridad: incident.prioridad,
    descripcion: incident.descripcion,
    fechaReporte: incident.fechaReporte ? incident.fechaReporte.toISOString() : undefined,
    fechaCreacion: incident.fechaCreacion ? incident.fechaCreacion.toISOString() : undefined,
    fechaSolucion: incident.fechaSolucion ? incident.fechaSolucion.toISOString() : undefined,
    aplica: incident.aplica,
    diasAbierto: incident.diasAbierto,
    esErroneo: incident.esErroneo,
    cliente: incident.cliente,
    idJira: incident.idJira,
    tipoBug: incident.tipoBug || undefined,
    areaAfectada: incident.areaAfectada || undefined,
    celula: incident.cell?.name || incident.celula,
    informadoPor: incident.informadoPor?.name || incident.informadoPorId,
    asignadoA: incident.asignadoA?.name || incident.asignadoAId
  }));
  
  // Guardar datos sincronizados en el archivo (esto elimina automáticamente los incidentes que ya no están en PostgreSQL)
  await writeJsonFile(INCIDENTS_FILE, formattedDbIncidents);
  
  console.log(`✅ ${newIncidentsCount} nuevos incidentes migrados a PostgreSQL`);
  console.log(`🗑️  ${deletedFromFileCount} incidentes eliminados del archivo`);
  console.log(`✅ ${formattedDbIncidents.length} incidentes sincronizados en total`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  syncIncidents()
    .then(() => {
      console.log('Sincronización de incidentes completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en la sincronización de incidentes:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
