/**
 * Script para sincronización bidireccional de planes de prueba entre archivos y PostgreSQL
 * Maneja creación, actualización y eliminación en ambas direcciones
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
 * Sincronización bidireccional de planes de prueba entre archivos y PostgreSQL
 */
export async function syncTestPlansBidirectional(): Promise<void> {
  console.log('🔄 Iniciando sincronización bidireccional de planes de prueba...');
  
  try {
    // ===== FASE 1: ARCHIVOS → POSTGRESQL =====
    console.log('\n📁 FASE 1: Sincronizando archivos → PostgreSQL');
    
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
    const fileTestPlanIds = new Set(fileTestPlans.map((tp: any) => tp.id));
    
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
                create: fileTestPlan.cycles.map((cycle: any) => ({
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
          console.log(`  ✅ Migrado plan de prueba: ${fileTestPlan.projectName} (${fileTestPlan.id})`);
        } catch (error) {
          console.error(`  ❌ Error al migrar el plan de prueba ${fileTestPlan.id}:`, error);
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
                  create: fileTestPlan.cycles.map((cycle: any) => ({
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
            console.log(`  🔄 Actualizado plan de prueba: ${fileTestPlan.projectName} (${fileTestPlan.id})`);
          } catch (error) {
            console.error(`  ❌ Error al actualizar el plan de prueba ${fileTestPlan.id}:`, error);
          }
        }
      }
    }
    
    console.log(`📁 FASE 1 completada: +${newTestPlansCount} nuevos, ~${updatedTestPlansCount} actualizados`);
    
    // ===== FASE 2: POSTGRESQL → ARCHIVOS (ELIMINACIONES) =====
    console.log('\n🗑️  FASE 2: Procesando eliminaciones PostgreSQL → Archivos');
    
    // Identificar planes de prueba eliminados (existen en PostgreSQL pero no en archivos)
    const deletedTestPlanIds: string[] = [];
    for (const dbTestPlan of dbTestPlans) {
      if (!fileTestPlanIds.has(dbTestPlan.id)) {
        deletedTestPlanIds.push(dbTestPlan.id);
      }
    }
    
    let deletedTestPlansCount = 0;
    for (const testPlanId of deletedTestPlanIds) {
      try {
        // Eliminar los ciclos primero (debido a la relación)
        await prisma.testCycle.deleteMany({
          where: { testPlanId: testPlanId }
        });
        
        // Eliminar el plan de prueba
        await prisma.testPlan.delete({
          where: { id: testPlanId }
        });
        
        deletedTestPlansCount++;
        console.log(`  🗑️  Eliminado plan de prueba: ${testPlanId}`);
      } catch (error) {
        console.error(`  ❌ Error al eliminar plan de prueba ${testPlanId}:`, error);
      }
    }
    
    console.log(`🗑️  FASE 2 completada: -${deletedTestPlansCount} eliminados`);
    
    // ===== FASE 3: SINCRONIZACIÓN FINAL =====
    console.log('\n💾 FASE 3: Sincronización final PostgreSQL → Archivos');
    
    // Obtener el estado final de PostgreSQL
    const finalDbTestPlans = await prisma.testPlan.findMany({
      include: {
        cycles: true
      }
    });
    
    // Transformar datos de PostgreSQL al formato de la aplicación
    const appTestPlans = finalDbTestPlans.map(dbTestPlan => ({
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
    
    console.log(`💾 FASE 3 completada: ${appTestPlans.length} planes de prueba sincronizados en archivo`);
    
    // ===== RESUMEN FINAL =====
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN BIDIRECCIONAL:');
    console.log(`   📁 Nuevos planes de prueba (Archivos → PostgreSQL): ${newTestPlansCount}`);
    console.log(`   🔄 Planes de prueba actualizados (Archivos → PostgreSQL): ${updatedTestPlansCount}`);
    console.log(`   🗑️  Planes de prueba eliminados (PostgreSQL → Archivos): ${deletedTestPlansCount}`);
    console.log(`   💾 Total planes de prueba en estado final: ${appTestPlans.length}`);
    console.log('✅ Sincronización bidireccional de planes de prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización bidireccional de planes de prueba:', error);
    throw error;
  }
}

// Ejecutar directamente si es llamado desde la línea de comandos
if (require.main === module) {
  syncTestPlansBidirectional()
    .then(() => {
      console.log('✅ Script de sincronización bidireccional ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script de sincronización bidireccional:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
