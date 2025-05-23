/**
 * Script para sincronizar proyectos entre archivos y PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Ruta al archivo de proyectos
const DATA_FOLDER = path.join(process.cwd(), 'data');
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
 * Sincronizar proyectos entre archivos y PostgreSQL
 * Archivos -> PostgreSQL y PostgreSQL -> Archivos (bidireccional)
 */
export async function syncProjects(): Promise<void> {
  console.log('Sincronizando proyectos...');
  
  // Obtener datos de archivos
  const fileProjects = await readJsonFile(PROJECTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbProjects = await prisma.project.findMany({
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
  
  // Mapear IDs para comparación rápida
  const dbProjectJiraIds = new Set(dbProjects.map(p => p.idJira));
  
  // Migrar proyectos que solo existen en archivos a PostgreSQL
  let newProjectsCount = 0;
  for (const fileProject of fileProjects) {
    if (!dbProjectJiraIds.has(fileProject.idJira)) {
      try {
        // Buscar equipo y célula por nombre
        const team = await prisma.team.findFirst({
          where: { name: { contains: fileProject.equipo?.trim() || '' } }
        });
        
        const cell = await prisma.cell.findFirst({
          where: { name: { contains: fileProject.celula?.trim() || '' } }
        });
        
        if (!team || !cell) {
          console.error(`❌ No se puede migrar el proyecto ${fileProject.idJira} por falta de equipo o célula`);
          continue;
        }
        
        // Crear el proyecto en PostgreSQL
        await prisma.project.create({
          data: {
            id: fileProject.id || uuidv4(),
            idJira: fileProject.idJira,
            nombre: fileProject.nombre || null,
            proyecto: fileProject.proyecto,
            horas: fileProject.horas || 0,
            dias: fileProject.dias || 0,
            horasEstimadas: fileProject.horasEstimadas || null,
            estado: fileProject.estado || null,
            estadoCalculado: fileProject.estadoCalculado || null,
            descripcion: fileProject.descripcion || null,
            fechaInicio: fileProject.fechaInicio ? new Date(fileProject.fechaInicio) : null,
            fechaFin: fileProject.fechaFin ? new Date(fileProject.fechaFin) : null,
            fechaEntrega: fileProject.fechaEntrega ? new Date(fileProject.fechaEntrega) : new Date(),
            fechaRealEntrega: fileProject.fechaRealEntrega ? new Date(fileProject.fechaRealEntrega) : null,
            fechaCertificacion: fileProject.fechaCertificacion ? new Date(fileProject.fechaCertificacion) : null,
            diasRetraso: fileProject.diasRetraso || 0,
            analistaProducto: fileProject.analistaProducto || '',
            planTrabajo: fileProject.planTrabajo || '',
            equipoId: team.id,
            celulaId: cell.id
          }
        });
        
        // Conectar analistas (si existen)
        if (fileProject.analistas && fileProject.analistas.length > 0) {
          for (const analystId of fileProject.analistas) {
            // Verificar si el analista existe
            const analystExists = await prisma.qAAnalyst.findUnique({
              where: { id: analystId }
            });
            
            if (analystExists) {
              await prisma.projectAnalyst.create({
                data: {
                  projectId: fileProject.id || uuidv4(),
                  analystId: analystId
                }
              });
            }
          }
        }
        
        newProjectsCount++;
      } catch (error) {
        console.error(`Error al migrar el proyecto ${fileProject.idJira}:`, error);
      }
    }
  }

  // Transformar los proyectos de PostgreSQL al formato de la aplicación para actualizar los archivos
  const formattedDbProjects = dbProjects.map(project => ({
    id: project.id,
    idJira: project.idJira,
    nombre: project.nombre || undefined,
    proyecto: project.proyecto,
    equipo: project.team?.name || project.equipoId,
    celula: project.cell?.name || project.celulaId,
    horas: project.horas || 0,
    dias: project.dias || 0,
    horasEstimadas: project.horasEstimadas || undefined,
    estado: project.estado || undefined,
    estadoCalculado: project.estadoCalculado as any || undefined,
    descripcion: project.descripcion || undefined,
    fechaInicio: project.fechaInicio ? project.fechaInicio.toISOString() : undefined,
    fechaFin: project.fechaFin ? project.fechaFin.toISOString() : undefined,
    fechaEntrega: project.fechaEntrega ? project.fechaEntrega.toISOString() : undefined,
    fechaRealEntrega: project.fechaRealEntrega ? project.fechaRealEntrega.toISOString() : undefined,
    fechaCertificacion: project.fechaCertificacion ? project.fechaCertificacion.toISOString() : undefined,
    diasRetraso: project.diasRetraso,
    analistaProducto: project.analistaProducto,
    planTrabajo: project.planTrabajo,
    analistas: project.analysts.map(rel => rel.analystId)
  }));
  
  // Guardar datos sincronizados en el archivo
  await writeJsonFile(PROJECTS_FILE, formattedDbProjects);
  
  console.log(`✅ ${newProjectsCount} nuevos proyectos migrados a PostgreSQL`);
  console.log(`✅ ${formattedDbProjects.length} proyectos sincronizados en total`);
}