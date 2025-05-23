/**
 * Script para sincronización bidireccional de casos de prueba entre archivos y PostgreSQL
 * Maneja creación, actualización y eliminación en ambas direcciones
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Importar interfaces
import { TestCase, TestStep, TestEvidence } from '../src/models/TestCase';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Ruta al archivo de casos de prueba
const DATA_FOLDER = path.join(process.cwd(), 'data');
const TEST_CASES_FILE = path.join(DATA_FOLDER, 'test-cases.txt');

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
 * Sincronización bidireccional de casos de prueba entre archivos y PostgreSQL
 */
export async function syncTestCasesBidirectional(): Promise<void> {
  console.log('🔄 Iniciando sincronización bidireccional de casos de prueba...');
  
  try {
    // ===== FASE 1: ARCHIVOS → POSTGRESQL =====
    console.log('\n📁 FASE 1: Sincronizando archivos → PostgreSQL');
    
    // Obtener datos de archivos
    const fileTestCases = await readJsonFile(TEST_CASES_FILE);
    
    // Obtener datos de PostgreSQL
    const dbTestCases = await prisma.testCase.findMany({
      include: {
        steps: true,
        evidences: true,
        defects: true
      }
    });
    
    // Mapear IDs para comparación rápida
    const dbTestCaseIds = new Set(dbTestCases.map(tc => tc.id));
    const fileTestCaseIds = new Set(fileTestCases.map((tc: any) => tc.id));
    
    // Transformar los casos de prueba de PostgreSQL al formato de aplicación
    const formattedDbTestCases = dbTestCases.map(dbTestCase => {
      return {
        id: dbTestCase.id,
        userStoryId: dbTestCase.userStoryId,
        name: dbTestCase.name,
        projectId: dbTestCase.projectId,
        testPlanId: dbTestCase.testPlanId,
        codeRef: dbTestCase.codeRef,
        steps: dbTestCase.steps.map(step => ({
          id: step.id,
          description: step.description,
          expected: step.expected
        })),
        expectedResult: dbTestCase.expectedResult,
        testType: dbTestCase.testType,
        status: dbTestCase.status,
        defects: dbTestCase.defects.map(defect => defect.incidentId),
        evidences: dbTestCase.evidences.map(evidence => ({
          id: evidence.id,
          date: evidence.date.toISOString(),
          tester: evidence.tester,
          precondition: evidence.precondition,
          steps: evidence.steps,
          screenshots: evidence.screenshots,
          result: evidence.result,
          comments: evidence.comments
        })),
        cycle: dbTestCase.cycle,
        category: dbTestCase.category,
        responsiblePerson: dbTestCase.responsiblePerson,
        priority: dbTestCase.priority,
        createdAt: dbTestCase.createdAt.toISOString(),
        updatedAt: dbTestCase.updatedAt.toISOString()
      };
    });
    
    // Migrar casos de prueba que solo existen en archivos a PostgreSQL
    let newTestCasesCount = 0;
    for (const fileTestCase of fileTestCases) {
      if (!dbTestCaseIds.has(fileTestCase.id)) {
        try {
          // Crear el caso de prueba en PostgreSQL
          await prisma.testCase.create({
            data: {
              id: fileTestCase.id,
              userStoryId: fileTestCase.userStoryId,
              name: fileTestCase.name,
              projectId: fileTestCase.projectId,
              testPlanId: fileTestCase.testPlanId,
              codeRef: fileTestCase.codeRef,
              expectedResult: fileTestCase.expectedResult,
              testType: fileTestCase.testType as any,
              status: fileTestCase.status as any,
              cycle: fileTestCase.cycle,
              category: fileTestCase.category || null,
              responsiblePerson: fileTestCase.responsiblePerson || null,
              priority: fileTestCase.priority as any || null,
              createdAt: new Date(fileTestCase.createdAt),
              updatedAt: new Date(fileTestCase.updatedAt),
              
              // Crear pasos
              steps: {
                create: fileTestCase.steps.map((step: any) => ({
                  id: step.id,
                  description: step.description,
                  expected: step.expected
                }))
              },
              // Crear evidencias
              evidences: {
                create: fileTestCase.evidences?.map((evidence: any) => ({
                  id: evidence.id,
                  date: new Date(evidence.date),
                  tester: evidence.tester,
                  precondition: evidence.precondition,
                  steps: evidence.steps,
                  screenshots: evidence.screenshots,
                  result: evidence.result,
                  comments: evidence.comments || null
                })) || []
              },
              
              // Conectar defectos
              defects: {
                create: fileTestCase.defects?.map((defectId: string) => ({
                  incident: {
                    connect: { id: defectId }
                  }
                })) || []
              }
            }
          });
          
          newTestCasesCount++;
          console.log(`  ✅ Migrado caso de prueba: ${fileTestCase.name} (${fileTestCase.id})`);
        } catch (error) {
          console.error(`  ❌ Error al migrar el caso de prueba ${fileTestCase.id}:`, error);
        }
      }
    }
    
    // Actualizar casos de prueba donde hay diferencias
    let updatedTestCasesCount = 0;
    for (const fileTestCase of fileTestCases) {
      if (dbTestCaseIds.has(fileTestCase.id)) {
        // Buscar el caso de prueba correspondiente en la lista formateada
        const dbTestCase = formattedDbTestCases.find(tc => tc.id === fileTestCase.id);
        
        // Comparar y actualizar si hay diferencias
        if (dbTestCase && JSON.stringify(dbTestCase) !== JSON.stringify(fileTestCase)) {
          try {
            // Eliminar las relaciones existentes antes de actualizar
            await prisma.testStep.deleteMany({
              where: { testCaseId: fileTestCase.id }
            });
            
            await prisma.testEvidence.deleteMany({
              where: { testCaseId: fileTestCase.id }
            });
            
            await prisma.testCaseDefect.deleteMany({
              where: { testCaseId: fileTestCase.id }
            });
            
            // Actualizar el caso de prueba con todos sus datos
            await prisma.testCase.update({
              where: { id: fileTestCase.id },
              data: {
                userStoryId: fileTestCase.userStoryId,
                name: fileTestCase.name,
                projectId: fileTestCase.projectId,
                testPlanId: fileTestCase.testPlanId,
                codeRef: fileTestCase.codeRef,
                expectedResult: fileTestCase.expectedResult,
                testType: fileTestCase.testType,
                status: fileTestCase.status,
                cycle: fileTestCase.cycle,
                category: fileTestCase.category || null,
                responsiblePerson: fileTestCase.responsiblePerson || null,
                priority: fileTestCase.priority || null,
                updatedAt: new Date(fileTestCase.updatedAt),
                
                // Recrear pasos
                steps: {
                  create: fileTestCase.steps.map((step: any) => ({
                    id: step.id,
                    description: step.description,
                    expected: step.expected
                  }))
                },
                
                // Recrear evidencias
                evidences: {
                  create: fileTestCase.evidences?.map((evidence: any) => ({
                    id: evidence.id,
                    date: new Date(evidence.date),
                    tester: evidence.tester,
                    precondition: evidence.precondition,
                    steps: evidence.steps,
                    screenshots: evidence.screenshots,
                    result: evidence.result,
                    comments: evidence.comments || null
                  })) || []
                },
                
                // Reconectar defectos
                defects: {
                  create: fileTestCase.defects?.map((defectId: string) => ({
                    incident: {
                      connect: { id: defectId }
                    }
                  })) || []
                }
              }
            });
            
            updatedTestCasesCount++;
            console.log(`  🔄 Actualizado caso de prueba: ${fileTestCase.name} (${fileTestCase.id})`);
          } catch (error) {
            console.error(`  ❌ Error al actualizar el caso de prueba ${fileTestCase.id}:`, error);
          }
        }
      }
    }
    
    console.log(`📁 FASE 1 completada: +${newTestCasesCount} nuevos, ~${updatedTestCasesCount} actualizados`);
    
    // ===== FASE 2: POSTGRESQL → ARCHIVOS (ELIMINACIONES) =====
    console.log('\n🗑️  FASE 2: Procesando eliminaciones PostgreSQL → Archivos');
    
    // Identificar casos de prueba eliminados (existen en PostgreSQL pero no en archivos)
    const deletedTestCaseIds: string[] = [];
    for (const dbTestCase of dbTestCases) {
      if (!fileTestCaseIds.has(dbTestCase.id)) {
        deletedTestCaseIds.push(dbTestCase.id);
      }
    }
    
    let deletedTestCasesCount = 0;
    for (const testCaseId of deletedTestCaseIds) {
      try {
        // Eliminar las relaciones primero
        await prisma.testStep.deleteMany({
          where: { testCaseId: testCaseId }
        });
        
        await prisma.testEvidence.deleteMany({
          where: { testCaseId: testCaseId }
        });
        
        await prisma.testCaseDefect.deleteMany({
          where: { testCaseId: testCaseId }
        });
        
        // Eliminar el caso de prueba
        await prisma.testCase.delete({
          where: { id: testCaseId }
        });
        
        deletedTestCasesCount++;
        console.log(`  🗑️  Eliminado caso de prueba: ${testCaseId}`);
      } catch (error) {
        console.error(`  ❌ Error al eliminar caso de prueba ${testCaseId}:`, error);
      }
    }
    
    console.log(`🗑️  FASE 2 completada: -${deletedTestCasesCount} eliminados`);
    
    // ===== FASE 3: SINCRONIZACIÓN FINAL =====
    console.log('\n💾 FASE 3: Sincronización final PostgreSQL → Archivos');
    
    // Obtener el estado final de PostgreSQL
    const finalDbTestCases = await prisma.testCase.findMany({
      include: {
        steps: true,
        evidences: true,
        defects: true
      }
    });
    
    // Transformar datos de PostgreSQL al formato de la aplicación
    const appTestCases = finalDbTestCases.map(dbTestCase => ({
      id: dbTestCase.id,
      userStoryId: dbTestCase.userStoryId,
      name: dbTestCase.name,
      projectId: dbTestCase.projectId,
      testPlanId: dbTestCase.testPlanId,
      codeRef: dbTestCase.codeRef,
      steps: dbTestCase.steps.map(step => ({
        id: step.id,
        description: step.description,
        expected: step.expected
      })),
      expectedResult: dbTestCase.expectedResult,
      testType: dbTestCase.testType,
      status: dbTestCase.status,
      defects: dbTestCase.defects.map(defect => defect.incidentId),
      evidences: dbTestCase.evidences.map(evidence => ({
        id: evidence.id,
        date: evidence.date.toISOString(),
        tester: evidence.tester,
        precondition: evidence.precondition,
        steps: evidence.steps,
        screenshots: evidence.screenshots,
        result: evidence.result,
        comments: evidence.comments
      })),
      cycle: dbTestCase.cycle,
      category: dbTestCase.category,
      responsiblePerson: dbTestCase.responsiblePerson,
      priority: dbTestCase.priority,
      createdAt: dbTestCase.createdAt.toISOString(),
      updatedAt: dbTestCase.updatedAt.toISOString()
    }));
    
    // Escribir datos sincronizados en el archivo
    await writeJsonFile(TEST_CASES_FILE, appTestCases);
    
    console.log(`💾 FASE 3 completada: ${appTestCases.length} casos de prueba sincronizados en archivo`);
    
    // ===== RESUMEN FINAL =====
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN BIDIRECCIONAL:');
    console.log(`   📁 Nuevos casos de prueba (Archivos → PostgreSQL): ${newTestCasesCount}`);
    console.log(`   🔄 Casos de prueba actualizados (Archivos → PostgreSQL): ${updatedTestCasesCount}`);
    console.log(`   🗑️  Casos de prueba eliminados (PostgreSQL → Archivos): ${deletedTestCasesCount}`);
    console.log(`   💾 Total casos de prueba en estado final: ${appTestCases.length}`);
    console.log('✅ Sincronización bidireccional de casos de prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización bidireccional de casos de prueba:', error);
    throw error;
  }
}

// Ejecutar directamente si es llamado desde la línea de comandos
if (require.main === module) {
  syncTestCasesBidirectional()
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
