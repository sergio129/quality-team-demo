/**
 * Script simplificado para sincronizar datos entre archivos y PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

// Rutas a los archivos de datos
const DATA_FOLDER = path.join(process.cwd(), 'data');
const ANALYSTS_FILE = path.join(DATA_FOLDER, 'analysts.txt');
const INCIDENTS_FILE = path.join(DATA_FOLDER, 'incidents.txt');
const TEST_CASES_FILE = path.join(DATA_FOLDER, 'test-cases.txt');
const TEST_PLANS_FILE = path.join(DATA_FOLDER, 'test-plans.txt');

const prisma = new PrismaClient();

/**
 * Lee un archivo JSON
 */
async function readJsonFile(filePath) {
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
async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error escribiendo ${filePath}:`, error);
    throw error;
  }
}

/**
 * Sincronizar analistas (desde archivos a PostgreSQL)
 */
async function syncAnalysts() {
  console.log('Sincronizando analistas...');
  
  // Obtener datos de archivos
  const fileAnalysts = await readJsonFile(ANALYSTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbAnalysts = await prisma.qAAnalyst.findMany();
  
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
            email: fileAnalyst.email || `${fileAnalyst.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
            role: fileAnalyst.role || 'Analista QA',
            color: fileAnalyst.color || null,
            availability: fileAnalyst.availability || 100
          }
        });
        
        newAnalystsCount++;
      } catch (error) {
        console.error(`Error al migrar el analista ${fileAnalyst.id}:`, error);
      }
    }
  }
  
  console.log(`✅ ${newAnalystsCount} nuevos analistas migrados a PostgreSQL`);
}

/**
 * Sincronizar incidentes (desde archivos a PostgreSQL)
 */
async function syncIncidents() {
  console.log('Sincronizando incidentes...');
  
  // Obtener datos de archivos
  const fileIncidents = await readJsonFile(INCIDENTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbIncidents = await prisma.incident.findMany();
  
  // Mapear IDs para comparación rápida
  const dbIncidentIds = new Set(dbIncidents.map(i => i.id));
  const dbIncidentMap = new Map(dbIncidents.map(i => [i.id, i]));
  
  let newIncidentsCount = 0;
  let updatedIncidentsCount = 0;
  
  // Procesar cada incidente de archivo
  for (const fileIncident of fileIncidents) {
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
      informedById = informer?.id;
    }
    
    if (fileIncident.asignadoA) {
      const assignee = await prisma.qAAnalyst.findFirst({
        where: {
          name: {
            contains: fileIncident.asignadoA.trim()
          }
        }
      });
      assignedToId = assignee?.id;
    }
    
    // Si no se encontraron los analistas, usar el primero disponible
    if (!informedById || !assignedToId) {
      const firstAnalyst = await prisma.qAAnalyst.findFirst();
      if (firstAnalyst) {
        if (!informedById) informedById = firstAnalyst.id;
        if (!assignedToId) assignedToId = firstAnalyst.id;
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
      cellId = cell?.id;
    }
    
    // Si no se encontró la célula, usar la primera disponible
    if (!cellId) {
      const firstCell = await prisma.cell.findFirst();
      if (firstCell) {
        cellId = firstCell.id;
      }
    }
    
    if (!cellId || !informedById || !assignedToId) {
      console.error(`❌ No se puede procesar el incidente ${fileIncident.id} por falta de referencias obligatorias`);
      continue;
    }
    
    // Valores por defecto para campos requeridos
    const diasAbierto = fileIncident.diasAbierto || 0;
    const cliente = fileIncident.cliente || "No especificado";
    const idJira = fileIncident.jiraId || "";
    
    if (!dbIncidentIds.has(fileIncident.id)) {
      // CASO 1: El incidente no existe en PostgreSQL - Crearlo
      try {
        await prisma.incident.create({
          data: {
            id: fileIncident.id,
            estado: fileIncident.estado || "Nuevo",
            prioridad: fileIncident.prioridad || "Media",
            descripcion: fileIncident.descripcion || "",
            fechaReporte: fileIncident.fechaReporte ? new Date(fileIncident.fechaReporte) : new Date(),
            fechaCreacion: fileIncident.fechaCreacion ? new Date(fileIncident.fechaCreacion) : new Date(),
            fechaSolucion: fileIncident.fechaSolucion ? new Date(fileIncident.fechaSolucion) : null,
            diasAbierto,
            esErroneo: fileIncident.esErroneo || false,
            aplica: fileIncident.aplica ?? true,
            cliente,
            idJira,
            tipoBug: fileIncident.tipoBug || null,
            areaAfectada: fileIncident.areaAfectada || null,
            
            // Relaciones
            celula: cellId,
            informadoPorId: informedById,
            asignadoAId: assignedToId
          }
        });
        
        newIncidentsCount++;
      } catch (error) {
        console.error(`Error al migrar el incidente ${fileIncident.id}:`, error);
      }
    } else {
      // CASO 2: El incidente ya existe en PostgreSQL - Actualizar si hay diferencias
      const dbIncident = dbIncidentMap.get(fileIncident.id);
      
      // Verificar si hay diferencias en campos básicos
      const basicFieldsDiffer = 
        dbIncident.estado !== (fileIncident.estado || "Nuevo") ||
        dbIncident.prioridad !== (fileIncident.prioridad || "Media") ||
        dbIncident.descripcion !== (fileIncident.descripcion || "") ||
        dbIncident.esErroneo !== (fileIncident.esErroneo || false) ||
        dbIncident.diasAbierto !== diasAbierto ||
        dbIncident.cliente !== cliente ||
        dbIncident.idJira !== idJira;
      
      // Si hay diferencias, actualizar
      if (basicFieldsDiffer) {
        try {
          // Actualizar el incidente
          await prisma.incident.update({
            where: { id: fileIncident.id },
            data: {
              estado: fileIncident.estado || "Nuevo",
              prioridad: fileIncident.prioridad || "Media",
              descripcion: fileIncident.descripcion || "",
              fechaReporte: fileIncident.fechaReporte ? new Date(fileIncident.fechaReporte) : new Date(),
              fechaCreacion: fileIncident.fechaCreacion ? new Date(fileIncident.fechaCreacion) : new Date(),
              fechaSolucion: fileIncident.fechaSolucion ? new Date(fileIncident.fechaSolucion) : null,
              diasAbierto,
              esErroneo: fileIncident.esErroneo || false,
              aplica: fileIncident.aplica ?? true,
              cliente,
              idJira,
              tipoBug: fileIncident.tipoBug || null,
              areaAfectada: fileIncident.areaAfectada || null,
              
              // Relaciones
              celula: cellId,
              informadoPorId: informedById,
              asignadoAId: assignedToId
            }
          });
          
          updatedIncidentsCount++;
        } catch (error) {
          console.error(`Error al actualizar el incidente ${fileIncident.id}:`, error);
        }
      }
    }
  }
  
  console.log(`✅ ${newIncidentsCount} nuevos incidentes migrados a PostgreSQL`);
  console.log(`✅ ${updatedIncidentsCount} incidentes actualizados en PostgreSQL`);
}

/**
 * Sincronizar casos de prueba (desde archivos a PostgreSQL)
 */
async function syncTestCases() {
  console.log('Sincronizando casos de prueba...');
  
  // Obtener datos de archivos
  const fileTestCases = await readJsonFile(TEST_CASES_FILE);
  
  // Obtener datos de PostgreSQL
  const dbTestCases = await prisma.testCase.findMany({
    include: {
      steps: true
    }
  });
  
  // Mapear IDs para comparación rápida
  const dbTestCaseIds = new Set(dbTestCases.map(tc => tc.id));
  const dbTestCaseMap = new Map(dbTestCases.map(tc => [tc.id, tc]));
  
  let newTestCasesCount = 0;
  let updatedTestCasesCount = 0;
  
  // Procesar cada caso de prueba de archivo
  for (const fileTestCase of fileTestCases) {
    if (!dbTestCaseIds.has(fileTestCase.id)) {
      // CASO 1: El caso de prueba no existe en PostgreSQL - Crearlo
      try {
        await prisma.testCase.create({
          data: {
            id: fileTestCase.id,
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
            createdAt: new Date(fileTestCase.createdAt),
            updatedAt: new Date(fileTestCase.updatedAt),
            
            // Crear pasos
            steps: {
              create: fileTestCase.steps.map(step => ({
                id: step.id,
                description: step.description,
                expected: step.expected
              }))
            }
          }
        });
        
        newTestCasesCount++;
      } catch (error) {
        console.error(`Error al migrar el caso de prueba ${fileTestCase.id}:`, error);
      }
    } else {
      // CASO 2: El caso de prueba ya existe en PostgreSQL - Actualizar si hay diferencias
      const dbTestCase = dbTestCaseMap.get(fileTestCase.id);
      
      // Verificar si hay diferencias en campos básicos
      const basicFieldsDiffer = 
        dbTestCase.name !== fileTestCase.name ||
        dbTestCase.userStoryId !== fileTestCase.userStoryId ||
        dbTestCase.expectedResult !== fileTestCase.expectedResult ||
        dbTestCase.testType !== fileTestCase.testType ||
        dbTestCase.status !== fileTestCase.status;
      
      // Verificar si los pasos son diferentes
      let stepsDiffer = dbTestCase.steps.length !== fileTestCase.steps.length;
      if (!stepsDiffer) {
        // Comparar cada paso
        const dbStepMap = new Map(dbTestCase.steps.map(s => [s.id, s]));
        for (const fileStep of fileTestCase.steps) {
          const dbStep = dbStepMap.get(fileStep.id);
          if (!dbStep || 
              dbStep.description !== fileStep.description ||
              dbStep.expected !== fileStep.expected) {
            stepsDiffer = true;
            break;
          }
        }
      }
      
      // Si hay diferencias, actualizar
      if (basicFieldsDiffer || stepsDiffer) {
        try {
          // Eliminar pasos existentes
          await prisma.testStep.deleteMany({
            where: { testCaseId: fileTestCase.id }
          });
          
          // Actualizar caso de prueba
          await prisma.testCase.update({
            where: { id: fileTestCase.id },
            data: {
              name: fileTestCase.name,
              userStoryId: fileTestCase.userStoryId,
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
  
  console.log(`✅ ${newTestCasesCount} nuevos casos de prueba migrados a PostgreSQL`);
  console.log(`✅ ${updatedTestCasesCount} casos de prueba actualizados en PostgreSQL`);
}

/**
 * Sincronizar planes de prueba (desde archivos a PostgreSQL)
 */
async function syncTestPlans() {
  console.log('Sincronizando planes de prueba...');
  
  // Obtener datos de archivos
  const fileTestPlans = await readJsonFile(TEST_PLANS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbTestPlans = await prisma.testPlan.findMany({
    include: {
      cycles: true
    }
  });
  
  // Mapear IDs para comparación rápida
  const dbTestPlanIds = new Set(dbTestPlans.map(tp => tp.id));
  const dbTestPlanMap = new Map(dbTestPlans.map(tp => [tp.id, tp]));
  
  let newTestPlansCount = 0;
  let updatedTestPlansCount = 0;
  
  // Procesar cada plan de prueba de archivo
  for (const fileTestPlan of fileTestPlans) {
    if (!dbTestPlanIds.has(fileTestPlan.id)) {
      // CASO 1: El plan de prueba no existe en PostgreSQL - Crearlo
      try {
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
    } else {
      // CASO 2: El plan de prueba ya existe en PostgreSQL - Actualizar si hay diferencias
      const dbTestPlan = dbTestPlanMap.get(fileTestPlan.id);
      
      // Verificar si hay diferencias en campos básicos
      const basicFieldsDiffer = 
        dbTestPlan.projectName !== fileTestPlan.projectName ||
        dbTestPlan.totalCases !== fileTestPlan.totalCases ||
        dbTestPlan.testQuality !== fileTestPlan.testQuality ||
        dbTestPlan.estimatedHours !== fileTestPlan.estimatedHours ||
        dbTestPlan.estimatedDays !== fileTestPlan.estimatedDays;
      
      // Verificar si los ciclos son diferentes
      let cyclesDiffer = dbTestPlan.cycles.length !== fileTestPlan.cycles.length;
      if (!cyclesDiffer) {
        // Comparar cada ciclo
        const dbCycleMap = new Map(dbTestPlan.cycles.map(c => [c.id, c]));
        for (const fileCycle of fileTestPlan.cycles) {
          const dbCycle = dbCycleMap.get(fileCycle.id);
          if (!dbCycle || 
              dbCycle.number !== fileCycle.number ||
              dbCycle.designed !== fileCycle.designed ||
              dbCycle.successful !== fileCycle.successful ||
              dbCycle.notExecuted !== fileCycle.notExecuted ||
              dbCycle.defects !== fileCycle.defects) {
            cyclesDiffer = true;
            break;
          }
        }
      }
      
      // Si hay diferencias, actualizar
      if (basicFieldsDiffer || cyclesDiffer) {
        try {
          // Eliminar ciclos existentes
          await prisma.testCycle.deleteMany({
            where: { testPlanId: fileTestPlan.id }
          });
          
          // Actualizar plan de prueba
          await prisma.testPlan.update({
            where: { id: fileTestPlan.id },
            data: {
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
  
  console.log(`✅ ${newTestPlansCount} nuevos planes de prueba migrados a PostgreSQL`);
  console.log(`✅ ${updatedTestPlansCount} planes de prueba actualizados en PostgreSQL`);
}

/**
 * Función principal
 */
async function main() {
  try {
    // Sincronizar analistas
    await syncAnalysts();
    
    // Sincronizar incidentes
    await syncIncidents();
    
    // Sincronizar casos de prueba y planes de prueba
    await syncTestCases();
    await syncTestPlans();
    
    console.log('✨ Sincronización completada con éxito!');
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
main();
