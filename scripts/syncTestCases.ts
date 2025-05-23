/**
 * Script para sincronizar casos de prueba entre archivos y PostgreSQL
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
 * Sincronizar casos de prueba entre archivos y PostgreSQL
 */
export async function syncTestCases(): Promise<void> {
  console.log('Sincronizando casos de prueba...');
  
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
      try {      // Crear el caso de prueba en PostgreSQL
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
              create: fileTestCase.defects?.map(defectId => ({
                incident: {
                  connect: { id: defectId }
                }
              })) || []
            }
          }
        });
        
        newTestCasesCount++;
      } catch (error) {
        console.error(`Error al migrar el caso de prueba ${fileTestCase.id}:`, error);
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
                create: fileTestCase.steps.map(step => ({
                  id: step.id,
                  description: step.description,
                  expected: step.expected
                }))
              },
              
              // Recrear evidencias
              evidences: {
                create: fileTestCase.evidences?.map(evidence => ({
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
                create: fileTestCase.defects?.map(defectId => ({
                  incident: {
                    connect: { id: defectId }
                  }
                })) || []
              }
            }
          });
          
          updatedTestCasesCount++;
        } catch (error) {
          console.error(`Error al actualizar el caso de prueba ${fileTestCase.id}:`, error);
        }
      }
    }
  }
  
  // Guardar los datos en el archivo para mantener la consistencia
  const allDbTestCases = await prisma.testCase.findMany({
    include: {
      steps: true,
      evidences: true,
      defects: true
    }
  });
  
  // Transformar datos de PostgreSQL al formato de la aplicación
  const appTestCases = allDbTestCases.map(dbTestCase => ({
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
  
  console.log(`✅ ${newTestCasesCount} nuevos casos de prueba migrados a PostgreSQL`);
  console.log(`✅ ${updatedTestCasesCount} casos de prueba actualizados en PostgreSQL`);
  console.log(`✅ ${appTestCases.length} casos de prueba sincronizados en total`);
}
