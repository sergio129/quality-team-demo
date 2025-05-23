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
const PROJECTS_FILE = path.join(DATA_FOLDER, 'seguimiento.txt');

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
 * Sincronizar analistas
 * Archivos -> PostgreSQL y PostgreSQL -> Archivos (bidireccional)
 */
async function syncAnalysts(): Promise<void> {
  console.log('Sincronizando analistas...');
  
  // Obtener datos de archivos
  const fileAnalysts = await readJsonFile(ANALYSTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbAnalysts = await prisma.qAAnalyst.findMany({
    include: {
      skills: true,
      certifications: true,
      specialties: true,
      cells: {
        include: {
          cell: true
        }
      }
    }
  });
  
  // Mapear IDs para comparación rápida
  const dbAnalystIds = new Set(dbAnalysts.map(a => a.id));
  
  // Migrar analistas que solo existen en archivos a PostgreSQL
  let newAnalystsCount = 0;
  for (const fileAnalyst of fileAnalysts) {
    if (!dbAnalystIds.has(fileAnalyst.id)) {
      // Crear el analista en PostgreSQL
      try {
        await prisma.qAAnalyst.create({
          data: {
            id: fileAnalyst.id,
            name: fileAnalyst.name,
            email: fileAnalyst.email,
            role: fileAnalyst.role,
            color: fileAnalyst.color || null,
            availability: fileAnalyst.availability || 100,
            // Las relaciones (skills, certifications, etc.) se manejarán después de crear el analista
          }
        });
        
        // Crear skills
        if (fileAnalyst.skills && fileAnalyst.skills.length > 0) {
          for (const skill of fileAnalyst.skills) {
            await prisma.skill.create({
              data: {
                name: typeof skill === 'string' ? skill : skill.name,
                level: typeof skill === 'string' ? 'Intermedio' : skill.level || 'Intermedio',
                analyst: {
                  connect: { id: fileAnalyst.id }
                }
              }
            });
          }
        }
        
        // Crear certificaciones
        if (fileAnalyst.certifications && fileAnalyst.certifications.length > 0) {
          for (const cert of fileAnalyst.certifications) {
            await prisma.certification.create({
              data: {
                name: cert.name,
                issuer: cert.issuer,
                date: new Date(cert.date),
                expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
                analyst: {
                  connect: { id: fileAnalyst.id }
                }
              }
            });
          }
        }
        
        // Crear especialidades
        if (fileAnalyst.specialties && fileAnalyst.specialties.length > 0) {
          for (const specialty of fileAnalyst.specialties) {
            await prisma.specialty.create({
              data: {
                name: specialty,
                analysts: {
                  connect: { id: fileAnalyst.id }
                }
              }
            });
          }
        }
        
        // Conectar células (si existen)
        if (fileAnalyst.cellIds && fileAnalyst.cellIds.length > 0) {
          for (const cellId of fileAnalyst.cellIds) {
            // Verificar si la célula existe
            const cellExists = await prisma.cell.findUnique({
              where: { id: cellId }
            });
            
            if (cellExists) {
              await prisma.analystCell.create({
                data: {
                  analyst: {
                    connect: { id: fileAnalyst.id }
                  },
                  cell: {
                    connect: { id: cellId }
                  }
                }
              });
            }
          }
        }
        
        newAnalystsCount++;
      } catch (error) {
        console.error(`Error al migrar el analista ${fileAnalyst.id}:`, error);
      }
    }
  }
  
  // Actualizar los datos en memoria después de las inserciones
  const updatedDbAnalysts = await prisma.qAAnalyst.findMany({
    include: {
      skills: true,
      certifications: true,
      specialties: true,
      cells: {
        include: {
          cell: true
        }
      }
    }
  });
  
  // Transformar al formato de la aplicación para mantener los archivos actualizados
  const appAnalysts = updatedDbAnalysts.map(analyst => ({
    id: analyst.id,
    name: analyst.name,
    email: analyst.email,
    role: analyst.role,
    color: analyst.color || undefined,
    availability: analyst.availability || 100,
    skills: analyst.skills.map(skill => skill.name),
    certifications: analyst.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date.toISOString(),
      expiryDate: cert.expiryDate?.toISOString() || undefined
    })),
    specialties: analyst.specialties.map(spec => spec.name),
    cellIds: analyst.cells.map(cell => cell.cellId)
  }));
  
  // Guardar en archivo para tener los datos actualizados
  await writeJsonFile(ANALYSTS_FILE, appAnalysts);
  
  console.log(`✅ ${newAnalystsCount} nuevos analistas migrados a PostgreSQL`);
  console.log(`✅ ${appAnalysts.length} analistas sincronizados en total`);
}

/**
 * Sincronizar equipos
 * PostgreSQL -> Archivos
 */
async function syncTeams(): Promise<void> {
  console.log('Sincronizando equipos...');
  
  // Obtener datos de PostgreSQL
  const dbTeams = await prisma.team.findMany({
    include: {
      analysts: {
        include: {
          analyst: true
        }
      }
    }
  });
  
  // Transformar al formato de la aplicación
  const appTeams = dbTeams.map(team => ({
    id: team.id,
    name: team.name,
    description: team.description || '',
    members: team.analysts.map(rel => rel.analystId)
  }));
  
  // Guardar en archivo
  await writeJsonFile(TEAMS_FILE, appTeams);
  console.log(`✅ ${appTeams.length} equipos sincronizados`);
}

/**
 * Sincronizar células
 * PostgreSQL -> Archivos
 */
async function syncCells(): Promise<void> {
  console.log('Sincronizando células...');
  
  // Obtener datos de PostgreSQL
  const dbCells = await prisma.cell.findMany();
  
  // Transformar al formato de la aplicación
  const appCells = dbCells.map(cell => ({
    id: cell.id,
    name: cell.name,
    description: cell.description || '',
    teamId: cell.teamId
  }));
  
  // Guardar en archivo
  await writeJsonFile(CELLS_FILE, appCells);
  console.log(`✅ ${appCells.length} células sincronizadas`);
}

// Implementar funciones similares para otros servicios:
// - syncTestPlans()
// - syncTestCases()
// - syncIncidents()
// - syncProjects()

/**
 * Función principal que ejecuta todas las sincronizaciones
 */
async function syncAll(): Promise<void> {
  try {
    console.log('🔄 Iniciando sincronización bidireccional entre archivos y PostgreSQL');
    
    // Analistas requieren sincronización según el reporte de verificación
    await syncAnalysts();
    
    // Equipos y células ya están sincronizados según la verificación
    // await syncTeams();
    // await syncCells();
    
    // Implementar código para casos de prueba y planes cuando sea necesario
    
    console.log('✨ Sincronización completada con éxito!');
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
syncAll();
