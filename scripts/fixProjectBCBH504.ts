/**
 * Script para crear el proyecto BCBH-504 en la base de datos
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Ruta al archivo de seguimiento de proyectos
const PROJECTS_FILE = path.join(process.cwd(), 'data', 'seguimiento.txt');

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

async function fixProject() {
  try {
    console.log('🔍 Buscando el proyecto BCBH-504 en el archivo de seguimiento...');
    
    // Obtener datos de archivo
    const projects = await readJsonFile(PROJECTS_FILE);
    
    // Buscar el proyecto específico
    const targetProject = projects.find(p => p.idJira === 'BCBH-504');
    
    if (!targetProject) {
      console.error('❌ No se encontró el proyecto BCBH-504 en el archivo de seguimiento');
      return;
    }
    
    // Verificar si el proyecto ya existe en la base de datos
    const existingProject = await prisma.project.findFirst({
      where: { 
        OR: [
          { idJira: 'BCBH-504' },
          { proyecto: targetProject.proyecto }
        ]
      }
    });
    
    if (existingProject) {
      console.log(`ℹ️ El proyecto ya existe en la base de datos con el ID: ${existingProject.id}`);
      return;
    }
    
    console.log('🔍 Buscando equipo y célula para el proyecto...');
    
    // Encontrar equipo y célula por nombre
    const team = await prisma.team.findFirst({
      where: { name: { contains: targetProject.equipo.trim() } }
    });
    
    if (!team) {
      console.log(`ℹ️ No se encontró el equipo "${targetProject.equipo}", buscando equipo similar...`);
      // Buscar un equipo similar si no se encuentra el exacto
      const teams = await prisma.team.findMany();
      console.log(`Equipos disponibles: ${teams.map(t => t.name).join(', ')}`);
      
      // Intentar con el primer equipo disponible
      if (teams.length > 0) {
        console.log(`ℹ️ Usando el equipo "${teams[0].name}" como alternativa`);
        const team = teams[0];
        
        // Buscar célula
        const cell = await prisma.cell.findFirst({
          where: { name: { contains: targetProject.celula.trim() } }
        });
        
        if (!cell) {
          console.log(`ℹ️ No se encontró la célula "${targetProject.celula}", buscando célula similar...`);
          // Buscar una célula similar si no se encuentra la exacta
          const cells = await prisma.cell.findMany();
          console.log(`Células disponibles: ${cells.map(c => c.name).join(', ')}`);
          
          // Intentar con la primera célula disponible
          if (cells.length > 0) {
            console.log(`ℹ️ Usando la célula "${cells[0].name}" como alternativa`);
            
            // Crear proyecto
            const newProject = await prisma.project.create({
              data: {
                id: targetProject.id || uuidv4(),
                idJira: targetProject.idJira,
                proyecto: targetProject.proyecto,
                equipo: targetProject.equipo,
                celula: targetProject.celula,
                horas: targetProject.horas || 0,
                dias: targetProject.dias || 0,
                horasEstimadas: targetProject.horasEstimadas,
                estado: targetProject.estado,
                estadoCalculado: targetProject.estadoCalculado || 'Por Iniciar',
                descripcion: targetProject.descripcion,
                fechaInicio: targetProject.fechaInicio ? new Date(targetProject.fechaInicio) : null,
                fechaFin: targetProject.fechaFin ? new Date(targetProject.fechaFin) : null,
                fechaEntrega: new Date(targetProject.fechaEntrega),
                fechaRealEntrega: targetProject.fechaRealEntrega ? new Date(targetProject.fechaRealEntrega) : null,
                fechaCertificacion: targetProject.fechaCertificacion ? new Date(targetProject.fechaCertificacion) : null,
                diasRetraso: targetProject.diasRetraso || 0,
                analistaProducto: targetProject.analistaProducto || '',
                planTrabajo: targetProject.planTrabajo || '',
                equipoId: team.id,
                celulaId: cells[0].id,
              }
            });
            
            console.log(`✅ Proyecto creado exitosamente con ID: ${newProject.id}`);
            return;
          }
        } else {
          // Crear proyecto con célula encontrada
          const newProject = await prisma.project.create({
            data: {
              id: targetProject.id || uuidv4(),
              idJira: targetProject.idJira,
              proyecto: targetProject.proyecto,
              equipo: targetProject.equipo,
              celula: targetProject.celula,
              horas: targetProject.horas || 0,
              dias: targetProject.dias || 0,
              horasEstimadas: targetProject.horasEstimadas,
              estado: targetProject.estado,
              estadoCalculado: targetProject.estadoCalculado || 'Por Iniciar',
              descripcion: targetProject.descripcion,
              fechaInicio: targetProject.fechaInicio ? new Date(targetProject.fechaInicio) : null,
              fechaFin: targetProject.fechaFin ? new Date(targetProject.fechaFin) : null,
              fechaEntrega: new Date(targetProject.fechaEntrega),
              fechaRealEntrega: targetProject.fechaRealEntrega ? new Date(targetProject.fechaRealEntrega) : null,
              fechaCertificacion: targetProject.fechaCertificacion ? new Date(targetProject.fechaCertificacion) : null,
              diasRetraso: targetProject.diasRetraso || 0,
              analistaProducto: targetProject.analistaProducto || '',
              planTrabajo: targetProject.planTrabajo || '',
              equipoId: team.id,
              celulaId: cell.id,
            }
          });
          
          console.log(`✅ Proyecto creado exitosamente con ID: ${newProject.id}`);
          return;
        }
      }
    } else {
      // Se encontró el equipo, buscar célula
      const cell = await prisma.cell.findFirst({
        where: { name: { contains: targetProject.celula.trim() } }
      });
      
      if (!cell) {
        console.log(`ℹ️ No se encontró la célula "${targetProject.celula}", buscando célula del equipo...`);
        // Buscar células del equipo
        const cells = await prisma.cell.findMany({
          where: { teamId: team.id }
        });
        
        // Intentar con la primera célula del equipo
        if (cells.length > 0) {
          console.log(`ℹ️ Usando la célula "${cells[0].name}" como alternativa`);
          
          // Crear proyecto
          const newProject = await prisma.project.create({
            data: {
              id: targetProject.id || uuidv4(),
              idJira: targetProject.idJira,
              proyecto: targetProject.proyecto,
              equipo: targetProject.equipo,
              celula: targetProject.celula,
              horas: targetProject.horas || 0,
              dias: targetProject.dias || 0,
              horasEstimadas: targetProject.horasEstimadas,
              estado: targetProject.estado,
              estadoCalculado: targetProject.estadoCalculado || 'Por Iniciar',
              descripcion: targetProject.descripcion,
              fechaInicio: targetProject.fechaInicio ? new Date(targetProject.fechaInicio) : null,
              fechaFin: targetProject.fechaFin ? new Date(targetProject.fechaFin) : null,
              fechaEntrega: new Date(targetProject.fechaEntrega),
              fechaRealEntrega: targetProject.fechaRealEntrega ? new Date(targetProject.fechaRealEntrega) : null,
              fechaCertificacion: targetProject.fechaCertificacion ? new Date(targetProject.fechaCertificacion) : null,
              diasRetraso: targetProject.diasRetraso || 0,
              analistaProducto: targetProject.analistaProducto || '',
              planTrabajo: targetProject.planTrabajo || '',
              equipoId: team.id,
              celulaId: cells[0].id,
            }
          });
          
          console.log(`✅ Proyecto creado exitosamente con ID: ${newProject.id}`);
          return;
        } else {
          console.error(`❌ No se encontraron células para el equipo ${team.name}`);
          return;
        }
      } else {
        // Crear proyecto con equipo y célula encontrados
        const newProject = await prisma.project.create({
          data: {
            id: targetProject.id || uuidv4(),
            idJira: targetProject.idJira,
            proyecto: targetProject.proyecto,
            equipo: targetProject.equipo,
            celula: targetProject.celula,
            horas: targetProject.horas || 0,
            dias: targetProject.dias || 0,
            horasEstimadas: targetProject.horasEstimadas,
            estado: targetProject.estado,
            estadoCalculado: targetProject.estadoCalculado || 'Por Iniciar',
            descripcion: targetProject.descripcion,
            fechaInicio: targetProject.fechaInicio ? new Date(targetProject.fechaInicio) : null,
            fechaFin: targetProject.fechaFin ? new Date(targetProject.fechaFin) : null,
            fechaEntrega: new Date(targetProject.fechaEntrega),
            fechaRealEntrega: targetProject.fechaRealEntrega ? new Date(targetProject.fechaRealEntrega) : null,
            fechaCertificacion: targetProject.fechaCertificacion ? new Date(targetProject.fechaCertificacion) : null,
            diasRetraso: targetProject.diasRetraso || 0,
            analistaProducto: targetProject.analistaProducto || '',
            planTrabajo: targetProject.planTrabajo || '',
            equipoId: team.id,
            celulaId: cell.id,
          }
        });
        
        console.log(`✅ Proyecto creado exitosamente con ID: ${newProject.id}`);
        return;
      }
    }
    
    console.error('❌ No se pudo crear el proyecto por falta de referencias obligatorias');
    
  } catch (error) {
    console.error('❌ Error al crear el proyecto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
fixProject();
