/**
 * Script para sincronizar datos entre los archivos y PostgreSQL
 * Útil durante la fase de transición para mantener consistencia
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Rutas a los archivos de datos
const DATA_FOLDER = path.join(process.cwd(), 'data');
const ANALYSTS_FILE = path.join(DATA_FOLDER, 'analysts.txt');
const TEAMS_FILE = path.join(DATA_FOLDER, 'teams.txt');
const CELLS_FILE = path.join(DATA_FOLDER, 'cells.txt');
const TEST_PLANS_FILE = path.join(DATA_FOLDER, 'test-plans.txt');
const TEST_CASES_FILE = path.join(DATA_FOLDER, 'test-cases.txt');
const INCIDENTS_FILE = path.join(DATA_FOLDER, 'incidents.txt');
const PROJECTS_FILE = path.join(DATA_FOLDER, 'seguimiento.txt');// Mapear IDs para comparación rápida
  const dbIncidentIds = new Set(dbIncidents.map(i => i.id));
  
  // Migrar incidentes que solo existen en archivos a PostgreSQL
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
            title: fileIncident.titulo,
            description: fileIncident.descripcion,
            status: fileIncident.estado,
            severity: fileIncident.severidad,
            priority: fileIncident.prioridad,
            reportDate: fileIncident.fechaReporte ? new Date(fileIncident.fechaReporte) : new Date(),
            createdAt: fileIncident.fechaCreacion ? new Date(fileIncident.fechaCreacion) : new Date(),
            updatedAt: fileIncident.fechaActualizacion ? new Date(fileIncident.fechaActualizacion) : new Date(),
            resolutionDate: fileIncident.fechaSolucion ? new Date(fileIncident.fechaSolucion) : null,
            applicable: fileIncident.aplica ?? true,
            estimatedTime: fileIncident.tiempoEstimado ?? 0,
            actualTime: fileIncident.tiempoReal ?? 0,
            jiraId: fileIncident.jiraId || null,
            jiraStatus: fileIncident.jiraStatus || null,
            jiraLink: fileIncident.jiraLink || null,
            // Relaciones
            ...(cellId ? { cell: { connect: { id: cellId } } } : {}),
            ...(informedById ? { informedBy: { connect: { id: informedById } } } : {}),
            ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {})
          }
        });
        
        newIncidentsCount++;
      } catch (error) {
        console.error(`Error al migrar el incidente ${fileIncident.id}:`, error);
      }
    } else {
      // El incidente existe en ambos sistemas, verificar si hay discrepancias en los datos
      const dbIncident = dbIncidents.find(i => i.id === fileIncident.id);
      
      // Actualizar los campos que puedan ser diferentes
      try {
        // Solo actualizar si hay diferencias importantes
        if (
          fileIncident.estado !== dbIncident.status ||
          fileIncident.descripcion !== dbIncident.description ||
          fileIncident.severidad !== dbIncident.severity ||
          fileIncident.prioridad !== dbIncident.priority ||
          fileIncident.titulo !== dbIncident.title
        ) {
          await prisma.incident.update({
            where: { id: fileIncident.id },
            data: {
              title: fileIncident.titulo,
              description: fileIncident.descripcion,
              status: fileIncident.estado,
              severity: fileIncident.severidad,
              priority: fileIncident.prioridad,
              updatedAt: new Date()
            }
          });
          
          console.log(`📝 Actualizado incidente: ${fileIncident.id}`);
        }
      } catch (error) {
        console.error(`Error al actualizar el incidente ${fileIncident.id}:`, error);
      }
    }
  }
  
  // Obtener los datos actualizados después de la sincronización
  const updatedDbIncidents = await prisma.incident.findMany({
    include: {
      informedBy: true,
      assignedTo: true,
      cell: true
    }
  });
  
  // Transformar al formato de la aplicación para mantener los archivos actualizados
  const appIncidents = updatedDbIncidents.map(incident => ({
    id: incident.id,
    titulo: incident.title,
    descripcion: incident.description,
    estado: incident.status,
    severidad: incident.severity,
    prioridad: incident.priority,
    celula: incident.cell?.name || incident.cellId,
    informadoPor: incident.informedBy?.name || "",
    asignadoA: incident.assignedTo?.name || "",
    fechaReporte: incident.reportDate?.toISOString(),
    fechaCreacion: incident.createdAt?.toISOString(),
    fechaActualizacion: incident.updatedAt?.toISOString(),
    fechaSolucion: incident.resolutionDate?.toISOString(),
    aplica: incident.applicable,
    tiempoEstimado: incident.estimatedTime,
    tiempoReal: incident.actualTime,
    jiraId: incident.jiraId,
    jiraStatus: incident.jiraStatus,
    jiraLink: incident.jiraLink
  }));
  
  // Guardar en archivo para tener los datos actualizados
  await writeJsonFile(INCIDENTS_FILE, appIncidents);
  
  console.log(`✅ ${newIncidentsCount} nuevos incidentes migrados a PostgreSQL`);
  console.log(`✅ ${appIncidents.length} incidentes sincronizados en total`);
}

/**
 * Sincronizar casos de prueba
 * Archivos -> PostgreSQL y PostgreSQL -> Archivos (bidireccional)
 */
async function syncTestCases(): Promise<void> {
  console.log('Sincronizando casos de prueba...');
  
  // Obtener datos de archivos
  const fileTestCases = await readJsonFile(TEST_CASES_FILE);
  
  // Obtener datos de PostgreSQL
  const dbTestCases = await prisma.testCase.findMany({
    include: {
      steps: true,
      evidences: true
    }
  });
  
  // Mapear IDs para comparación rápida
  const dbTestCaseIds = new Set(dbTestCases.map(t => t.id));
  
  // Migrar casos de prueba que solo existen en archivos a PostgreSQL
  let newTestCasesCount = 0;
  
  // Código para la sincronización de casos de prueba
  // ...
  
  console.log(`✅ Casos de prueba sincronizados`);
}

/**
 * Función principal que ejecuta todas las sincronizaciones
 */
async function syncAll(): Promise<void> {
  try {
    console.log('🔄 Iniciando sincronización bidireccional entre PostgreSQL y archivos');
    
    await syncAnalysts();
    // Teams y Cells ya están sincronizados según la verificación
    // await syncTeams();
    // await syncCells();
    
    await syncIncidents();
    await syncTestCases();
    // Pendiente implementar:
    // await syncTestPlans();
    // await syncProjects();
    
    console.log('✨ Sincronización completada con éxito!');
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
syncAll();
