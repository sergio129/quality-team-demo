/**
 * Script para migrar datos desde archivos de texto a PostgreSQL
 * Utiliza Prisma para interactuar con la base de datos
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Rutas a los archivos de datos
const ANALYSTS_FILE = path.join(process.cwd(), 'data', 'analysts.txt');
const TEAMS_FILE = path.join(process.cwd(), 'data', 'teams.txt');
const CELLS_FILE = path.join(process.cwd(), 'data', 'cells.txt');
const TEST_PLANS_FILE = path.join(process.cwd(), 'data', 'test-plans.txt');
const TEST_CASES_FILE = path.join(process.cwd(), 'data', 'test-cases.txt');
const INCIDENTS_FILE = path.join(process.cwd(), 'data', 'incidents.txt');
const PROJECTS_FILE = path.join(process.cwd(), 'data', 'seguimiento.txt');

// Helper para leer archivos JSON
async function readJsonFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const cleanedContent = content.replace(/\/\/.*/, ''); // Eliminar comentarios
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Migrar equipos (teams)
async function migrateTeams() {
  console.log('Migrando equipos...');
  const teams = await readJsonFile(TEAMS_FILE);
  
  for (const team of teams) {
    try {
      await prisma.team.create({
        data: {
          id: team.id,
          name: team.name,
          description: team.description || '',
        }
      });
      console.log(`✅ Equipo migrado: ${team.name}`);
    } catch (error) {
      console.error(`❌ Error migrando equipo ${team.name}:`, error);
    }
  }
}

// Migrar células (cells)
async function migrateCells() {
  console.log('Migrando células...');
  const cells = await readJsonFile(CELLS_FILE);
  
  for (const cell of cells) {
    try {
      await prisma.cell.create({
        data: {
          id: cell.id,
          name: cell.name,
          description: cell.description || '',
          teamId: cell.teamId,
        }
      });
      console.log(`✅ Célula migrada: ${cell.name}`);
    } catch (error) {
      console.error(`❌ Error migrando célula ${cell.name}:`, error);
    }
  }
}

// Migrar analistas (QAAnalysts)
async function migrateAnalysts() {
  console.log('Migrando analistas...');
  const analysts = await readJsonFile(ANALYSTS_FILE);
  
  for (const analyst of analysts) {
    try {
      // Crear analista
      await prisma.qAAnalyst.create({
        data: {
          id: analyst.id,
          name: analyst.name.trim(),
          email: analyst.email,
          role: analyst.role,
          color: analyst.color,
          availability: analyst.availability,
        }
      });
      
      // Migrar skills del analista
      if (analyst.skills && analyst.skills.length > 0) {
        for (const skill of analyst.skills) {
          await prisma.skill.create({
            data: {
              name: skill.name,
              level: skill.level,
              analystId: analyst.id,
            }
          });
        }
      }
      
      // Migrar certificaciones del analista
      if (analyst.certifications && analyst.certifications.length > 0) {
        for (const cert of analyst.certifications) {
          await prisma.certification.create({
            data: {
              name: cert.name,
              issuer: cert.issuer,
              date: new Date(cert.date),
              expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
              analystId: analyst.id,
            }
          });
        }
      }
      
      // Migrar especialidades del analista
      if (analyst.specialties && analyst.specialties.length > 0) {
        for (const specialty of analyst.specialties) {
          await prisma.specialty.create({
            data: {
              name: specialty,
              analystId: analyst.id,
            }
          });
        }
      }
      
      // Migrar relaciones con células
      if (analyst.cellIds && analyst.cellIds.length > 0) {
        for (const cellId of analyst.cellIds) {
          await prisma.analystCell.create({
            data: {
              analystId: analyst.id,
              cellId,
            }
          });
        }
      }
      
      console.log(`✅ Analista migrado: ${analyst.name}`);
    } catch (error) {
      console.error(`❌ Error migrando analista ${analyst.name}:`, error);
    }
  }
}

// Migrar relaciones entre equipos y analistas
async function migrateTeamAnalystRelations() {
  console.log('Migrando relaciones entre equipos y analistas...');
  const teams = await readJsonFile(TEAMS_FILE);
  
  for (const team of teams) {
    if (team.members && team.members.length > 0) {
      for (const analystId of team.members) {
        try {
          await prisma.teamAnalyst.create({
            data: {
              teamId: team.id,
              analystId,
            }
          });
        } catch (error) {
          console.error(`❌ Error migrando relación entre equipo ${team.name} y analista ${analystId}:`, error);
        }
      }
    }
  }
}

// Migrar planes de prueba (test plans)
async function migrateTestPlans() {
  console.log('Migrando planes de prueba...');
  const testPlans = await readJsonFile(TEST_PLANS_FILE);
  
  for (const plan of testPlans) {
    try {
      // Crear plan de prueba
      await prisma.testPlan.create({
        data: {
          id: plan.id,
          projectId: plan.projectId,
          projectName: plan.projectName,
          codeReference: plan.codeReference,
          startDate: new Date(plan.startDate),
          endDate: new Date(plan.endDate),
          estimatedHours: plan.estimatedHours,
          estimatedDays: plan.estimatedDays,
          totalCases: plan.totalCases,
          testQuality: plan.testQuality,
          createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date(),
        }
      });
      
      // Migrar ciclos del plan
      if (plan.cycles && plan.cycles.length > 0) {
        for (const cycle of plan.cycles) {
          await prisma.testCycle.create({
            data: {
              id: cycle.id,
              number: cycle.number,
              designed: cycle.designed,
              successful: cycle.successful,
              notExecuted: cycle.notExecuted,
              defects: cycle.defects,
              startDate: cycle.startDate ? new Date(cycle.startDate) : null,
              endDate: cycle.endDate ? new Date(cycle.endDate) : null,
              testPlanId: plan.id,
            }
          });
        }
      }
      
      console.log(`✅ Plan de prueba migrado: ${plan.projectName}`);
    } catch (error) {
      console.error(`❌ Error migrando plan de prueba ${plan.projectName}:`, error);
    }
  }
}

// Migrar casos de prueba (test cases)
async function migrateTestCases() {
  console.log('Migrando casos de prueba...');
  const testCases = await readJsonFile(TEST_CASES_FILE);
  
  for (const testCase of testCases) {
    try {
      // Crear caso de prueba
      await prisma.testCase.create({
        data: {
          id: testCase.id,
          userStoryId: testCase.userStoryId,
          name: testCase.name,
          projectId: testCase.projectId,
          codeRef: testCase.codeRef,
          expectedResult: testCase.expectedResult,
          testType: testCase.testType,
          status: testCase.status,
          category: testCase.category,
          responsiblePerson: testCase.responsiblePerson,
          priority: testCase.priority,
          cycle: testCase.cycle,
          testPlanId: testCase.testPlanId,
          createdAt: testCase.createdAt ? new Date(testCase.createdAt) : new Date(),
          updatedAt: testCase.updatedAt ? new Date(testCase.updatedAt) : new Date(),
        }
      });
      
      // Migrar pasos del caso de prueba
      if (testCase.steps && testCase.steps.length > 0) {
        for (const step of testCase.steps) {
          await prisma.testStep.create({
            data: {
              id: step.id,
              description: step.description,
              expected: step.expected || '',
              testCaseId: testCase.id,
            }
          });
        }
      }
      
      // Migrar evidencias del caso de prueba
      if (testCase.evidences && testCase.evidences.length > 0) {
        for (const evidence of testCase.evidences) {
          await prisma.testEvidence.create({
            data: {
              id: evidence.id,
              date: new Date(evidence.date),
              tester: evidence.tester,
              precondition: evidence.precondition || '',
              result: evidence.result,
              comments: evidence.comments,
              steps: evidence.steps || [],
              screenshots: evidence.screenshots || [],
              testCaseId: testCase.id,
            }
          });
        }
      }
      
      console.log(`✅ Caso de prueba migrado: ${testCase.name}`);
    } catch (error) {
      console.error(`❌ Error migrando caso de prueba ${testCase.name}:`, error);
    }
  }
}

// Migrar incidentes (incidents/bugs)
async function migrateIncidents() {
  console.log('Migrando incidentes...');
  const incidents = await readJsonFile(INCIDENTS_FILE);
  
  for (const incident of incidents) {
    try {
      // Primero tenemos que encontrar las células por nombre
      const cell = await prisma.cell.findFirst({
        where: { name: incident.celula.trim() }
      });
      
      if (!cell) {
        console.error(`❌ No se encontró la célula ${incident.celula} para el incidente ${incident.id}`);
        continue;
      }
      
      // Encontrar analistas por nombre
      const informadoPor = await prisma.qAAnalyst.findFirst({
        where: { name: { contains: incident.informadoPor.trim() } }
      });
      
      const asignadoA = await prisma.qAAnalyst.findFirst({
        where: { name: { contains: incident.asignadoA.trim() } }
      });
      
      if (!informadoPor || !asignadoA) {
        console.error(`❌ No se encontraron los analistas para el incidente ${incident.id}`);
        continue;
      }
      
      // Crear incidente
      await prisma.incident.create({
        data: {
          id: incident.id,
          estado: incident.estado,
          prioridad: incident.prioridad,
          descripcion: incident.descripcion,
          fechaCreacion: new Date(incident.fechaCreacion),
          fechaReporte: new Date(incident.fechaReporte),
          fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : null,
          diasAbierto: incident.diasAbierto,
          esErroneo: incident.esErroneo,
          aplica: incident.aplica,
          cliente: incident.cliente,
          idJira: incident.idJira,
          tipoBug: incident.tipoBug,
          areaAfectada: incident.areaAfectada,
          celula: cell.id,
          informadoPorId: informadoPor.id,
          asignadoAId: asignadoA.id,
        }
      });
      
      // Migrar etiquetas (si existen)
      if (incident.etiquetas && incident.etiquetas.length > 0) {
        for (const tag of incident.etiquetas) {
          await prisma.tag.create({
            data: {
              name: tag,
              incidentId: incident.id,
            }
          });
        }
      }
      
      // Migrar historial de estados (si existe)
      if (incident.historialEstados && incident.historialEstados.length > 0) {
        for (const state of incident.historialEstados) {
          await prisma.stateChange.create({
            data: {
              estado: state.estado,
              fecha: new Date(state.fecha),
              comentario: state.comentario,
              incidentId: incident.id,
            }
          });
        }
      }
      
      console.log(`✅ Incidente migrado: ${incident.id}`);
    } catch (error) {
      console.error(`❌ Error migrando incidente ${incident.id}:`, error);
    }
  }
}

// Migrar proyectos (seguimiento.txt)
async function migrateProjects() {
  console.log('Migrando proyectos...');
  const projects = await readJsonFile(PROJECTS_FILE);
  
  for (const project of projects) {
    try {
      // Encontrar equipo y célula por nombre
      const team = await prisma.team.findFirst({
        where: { name: project.equipo.trim() }
      });
      
      const cell = await prisma.cell.findFirst({
        where: { name: { contains: project.celula.trim() } }
      });
      
      if (!team || !cell) {
        console.error(`❌ No se encontró el equipo o célula para el proyecto ${project.idJira}`);
        continue;
      }
      
      // Crear proyecto
      await prisma.project.create({
        data: {
          id: project.id || crypto.randomUUID(),
          idJira: project.idJira,
          nombre: project.nombre,
          proyecto: project.proyecto,
          horas: project.horas,
          dias: project.dias,
          horasEstimadas: project.horasEstimadas,
          estado: project.estado,
          estadoCalculado: project.estadoCalculado,
          descripcion: project.descripcion,
          fechaInicio: project.fechaInicio ? new Date(project.fechaInicio) : null,
          fechaFin: project.fechaFin ? new Date(project.fechaFin) : null,
          fechaEntrega: new Date(project.fechaEntrega),
          fechaRealEntrega: project.fechaRealEntrega ? new Date(project.fechaRealEntrega) : null,
          fechaCertificacion: project.fechaCertificacion ? new Date(project.fechaCertificacion) : null,
          diasRetraso: project.diasRetraso,
          analistaProducto: project.analistaProducto,
          planTrabajo: project.planTrabajo,
          equipoId: team.id,
          celulaId: cell.id,
        }
      });
      
      // Migrar relaciones con analistas (si existen)
      if (project.analistas && project.analistas.length > 0) {
        for (const analystId of project.analistas) {
          await prisma.projectAnalyst.create({
            data: {
              projectId: project.id,
              analystId,
            }
          });
        }
      }
      
      console.log(`✅ Proyecto migrado: ${project.idJira}`);
    } catch (error) {
      console.error(`❌ Error migrando proyecto ${project.idJira}:`, error);
    }
  }
}

// Migrar relaciones entre casos de prueba e incidentes
async function migrateDefectRelations() {
  console.log('Migrando relaciones entre casos de prueba e incidentes...');
  const testCases = await readJsonFile(TEST_CASES_FILE);
  
  for (const testCase of testCases) {
    if (testCase.defects && testCase.defects.length > 0) {
      for (const defectId of testCase.defects) {
        try {
          await prisma.defectRelation.create({
            data: {
              testCaseId: testCase.id,
              incidentId: defectId,
            }
          });
        } catch (error) {
          console.error(`❌ Error migrando relación entre caso de prueba ${testCase.id} e incidente ${defectId}:`, error);
        }
      }
    }
  }
}

// Función principal que ejecuta todas las migraciones en orden correcto
async function migrateAll() {
  try {
    console.log('🚀 Iniciando migración de datos a PostgreSQL...');
    
    // Orden de migración para respetar integridad referencial
    await migrateTeams();
    await migrateCells();
    await migrateAnalysts();
    await migrateTeamAnalystRelations();
    await migrateTestPlans();
    await migrateTestCases();
    await migrateIncidents();
    await migrateProjects();
    await migrateDefectRelations();
    
    console.log('✨ Migración completada con éxito!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateAll();