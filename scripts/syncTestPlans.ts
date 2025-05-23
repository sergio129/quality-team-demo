/**
 * Script para sincronizar planes de prueba entre archivos y PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Ruta al archivo de planes de prueba
const DATA_FOLDER = path.join(process.cwd(), 'data');
const TEST_PLANS_FILE = path.join(DATA_FOLDER, 'test-plans.txt');

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
 * Sincronizar planes de prueba entre archivos y PostgreSQL
 */
export async function syncTestPlans(): Promise<void> {
  console.log('Sincronizando planes de prueba...');
  
  // Obtener datos de archivos
  const fileTestPlans = await readJsonFile(TEST_PLANS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbTestPlans = await prisma.testPlan.findMany({
    include: {
      cycles: true,
      testCases: true
    }
  });
  
  // Mapear IDs para comparación rápida
  const dbTestPlanIds = new Set(dbTestPlans.map(tp => tp.id));
  
  // Transformar los planes de prueba de PostgreSQL al formato de aplicación
  const formattedDbTestPlans = dbTestPlans.map(dbTestPlan => {
    return {
      id: dbTestPlan.id,
      projectId: dbTestPlan.projectId,
      projectName: dbTestPlan.projectName,
      codeReference: dbTestPlan.codeReference,
      startDate: dbTestPlan.startDate.toISOString(),
      endDate: dbTestPlan.endDate.toISOString(),
      estimatedHours: dbTestPlan.estimatedHours,
      estimatedDays: dbTestPlan.estimatedDays,
      totalCases: dbTestPlan.totalCases,
      cycles: dbTestPlan.cycles.map(cycle => ({
        id: cycle.id,
        number: cycle.number,
        designed: cycle.designed,
        successful: cycle.successful,
        notExecuted: cycle.notExecuted,
        defects: cycle.defects,
        startDate: cycle.startDate?.toISOString(),
        endDate: cycle.endDate?.toISOString()
      })),
      testQuality: dbTestPlan.testQuality,
      createdAt: dbTestPlan.createdAt.toISOString(),
      updatedAt: dbTestPlan.updatedAt.toISOString()
    };
  });
  
  // Migrar planes de prueba que solo existen en archivos a PostgreSQL
  let newTestPlansCount = 0;
  for (const fileTestPlan of fileTestPlans) {
    if (!dbTestPlanIds.has(fileTestPlan.id)) {
      try {
        // Crear el plan de prueba en PostgreSQL
        await prisma.testPlan.create({
          data: {
            id: fileTestPlan.id,
            projectId: fileTestPlan.projectId,
            projectName: fileTestPlan.projectName,
            codeReference: fileTestPlan.codeReference,
            startDate: new Date(fileTestPlan.startDate),
            endDate: new Date(fileTestPlan.endDate),
            estimatedHours: fileTestPlan.estimatedHours,
            estimatedDays: fileTestPlan.estimatedDays,
            totalCases: fileTestPlan.totalCases,
            testQuality: fileTestPlan.testQuality,
            createdAt: new Date(fileTestPlan.createdAt),
            updatedAt: new Date(fileTestPlan.updatedAt),
            
            // Crear ciclos
            cycles: {
              create: fileTestPlan.cycles.map(cycle => ({
                id: cycle.id,
                number: cycle.number,
                designed: cycle.designed,
                successful: cycle.successful,
                notExecuted: cycle.notExecuted,
                defects: cycle.defects,
                startDate: cycle.startDate ? new Date(cycle.startDate) : null,
                endDate: cycle.endDate ? new Date(cycle.endDate) : null
              }))
            }
          }
        });
        
        newTestPlansCount++;
      } catch (error) {
        console.error(`Error al migrar el plan de prueba ${fileTestPlan.id}:`, error);
      }
    }
  }
  
  // Actualizar planes de prueba donde hay diferencias
  let updatedTestPlansCount = 0;
  for (const fileTestPlan of fileTestPlans) {
    if (dbTestPlanIds.has(fileTestPlan.id)) {
      // Buscar el plan de prueba correspondiente en la lista formateada
      const dbTestPlan = formattedDbTestPlans.find(tp => tp.id === fileTestPlan.id);
      
      // Comparar y actualizar si hay diferencias
      if (dbTestPlan && JSON.stringify(dbTestPlan) !== JSON.stringify(fileTestPlan)) {
        try {
          // Eliminar los ciclos existentes antes de actualizar
          await prisma.testCycle.deleteMany({
            where: { testPlanId: fileTestPlan.id }
          });
          
          // Actualizar el plan de prueba con todos sus datos
          await prisma.testPlan.update({
            where: { id: fileTestPlan.id },
            data: {
              projectId: fileTestPlan.projectId,
              projectName: fileTestPlan.projectName,
              codeReference: fileTestPlan.codeReference,
              startDate: new Date(fileTestPlan.startDate),
              endDate: new Date(fileTestPlan.endDate),
              estimatedHours: fileTestPlan.estimatedHours,
              estimatedDays: fileTestPlan.estimatedDays,
              totalCases: fileTestPlan.totalCases,
              testQuality: fileTestPlan.testQuality,
              updatedAt: new Date(fileTestPlan.updatedAt),
              
              // Recrear ciclos
              cycles: {
                create: fileTestPlan.cycles.map(cycle => ({
                  id: cycle.id,
                  number: cycle.number,
                  designed: cycle.designed,
                  successful: cycle.successful,
                  notExecuted: cycle.notExecuted,
                  defects: cycle.defects,
                  startDate: cycle.startDate ? new Date(cycle.startDate) : null,
                  endDate: cycle.endDate ? new Date(cycle.endDate) : null
                }))
              }
            }
          });
          
          updatedTestPlansCount++;
        } catch (error) {
          console.error(`Error al actualizar el plan de prueba ${fileTestPlan.id}:`, error);
        }
      }
    }
  }
  
  // Guardar los datos en el archivo para mantener la consistencia
  const allDbTestPlans = await prisma.testPlan.findMany({
    include: {
      cycles: true
    }
  });
  
  // Transformar datos de PostgreSQL al formato de la aplicación
  const appTestPlans = allDbTestPlans.map(dbTestPlan => ({
    id: dbTestPlan.id,
    projectId: dbTestPlan.projectId,
    projectName: dbTestPlan.projectName,
    codeReference: dbTestPlan.codeReference,
    startDate: dbTestPlan.startDate.toISOString(),
    endDate: dbTestPlan.endDate.toISOString(),
    estimatedHours: dbTestPlan.estimatedHours,
    estimatedDays: dbTestPlan.estimatedDays,
    totalCases: dbTestPlan.totalCases,
    cycles: dbTestPlan.cycles.map(cycle => ({
      id: cycle.id,
      number: cycle.number,
      designed: cycle.designed,
      successful: cycle.successful,
      notExecuted: cycle.notExecuted,
      defects: cycle.defects,
      startDate: cycle.startDate?.toISOString(),
      endDate: cycle.endDate?.toISOString()
    })),
    testQuality: dbTestPlan.testQuality,
    createdAt: dbTestPlan.createdAt.toISOString(),
    updatedAt: dbTestPlan.updatedAt.toISOString()
  }));
  
  // Escribir datos sincronizados en el archivo
  await writeJsonFile(TEST_PLANS_FILE, appTestPlans);
  
  console.log(`✅ ${newTestPlansCount} nuevos planes de prueba migrados a PostgreSQL`);
  console.log(`✅ ${updatedTestPlansCount} planes de prueba actualizados en PostgreSQL`);
  console.log(`✅ ${appTestPlans.length} planes de prueba sincronizados en total`);
}
