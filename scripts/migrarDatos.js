// Script para migrar los datos de archivos .txt a la base de datos PostgreSQL
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

const DATA_FOLDER = path.join(process.cwd(), 'data');

async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_FOLDER, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error);
    return [];
  }
}

async function migrarAnalistas() {
  console.log('Migrando analistas...');
  const analysts = await readJsonFile('analysts.txt');
  
  for (const analyst of analysts) {
    try {
      // Convertir las habilidades, certificaciones y especialidades a formato compatible con Prisma
      const skills = analyst.skills.map(skill => ({ name: skill, level: 'Intermedio' }));
      const certifications = analyst.certifications.map(cert => ({
        name: cert.name,
        issuer: cert.issuer || 'Desconocido',
        date: cert.date ? new Date(cert.date) : new Date(),
      }));
      const specialties = analyst.specialties.map(spec => ({ name: spec }));

      // Crear el analista en la base de datos
      await prisma.qAAnalyst.upsert({
        where: { id: analyst.id },
        update: {
          name: analyst.name,
          email: analyst.email,
          role: analyst.role || 'Junior',
          color: analyst.color,
          availability: analyst.availability || 100,
        },
        create: {
          id: analyst.id,
          name: analyst.name,
          email: analyst.email,
          role: analyst.role || 'Junior',
          color: analyst.color,
          availability: analyst.availability || 100,
          skills: {
            create: skills,
          },
          certifications: {
            create: certifications,
          },
          specialties: {
            create: specialties,
          }
        },
      });
      
      console.log(`Analista migrado: ${analyst.name}`);
    } catch (error) {
      console.error(`Error migrando analista ${analyst.name}:`, error);
    }
  }
}

async function migrarEquipos() {
  console.log('Migrando equipos...');
  const teams = await readJsonFile('teams.txt');
  
  for (const team of teams) {
    try {
      await prisma.team.upsert({
        where: { id: team.id },
        update: {
          name: team.name,
          description: team.description,
        },
        create: {
          id: team.id,
          name: team.name,
          description: team.description,
        },
      });
      
      // Crear relaciones entre equipos y analistas
      if (team.members && team.members.length > 0) {
        for (const memberId of team.members) {
          await prisma.teamAnalyst.upsert({
            where: {
              teamId_analystId: {
                teamId: team.id,
                analystId: memberId,
              },
            },
            update: {},
            create: {
              team: { connect: { id: team.id } },
              analyst: { connect: { id: memberId } },
            },
          });
        }
      }
      
      console.log(`Equipo migrado: ${team.name}`);
    } catch (error) {
      console.error(`Error migrando equipo ${team.name}:`, error);
    }
  }
}

async function migrarCelulas() {
  console.log('Migrando células...');
  const cells = await readJsonFile('cells.txt');
  
  for (const cell of cells) {
    try {
      await prisma.cell.upsert({
        where: { id: cell.id },
        update: {
          name: cell.name,
          description: cell.description,
          teamId: cell.teamId,
        },
        create: {
          id: cell.id,
          name: cell.name,
          description: cell.description,
          team: { connect: { id: cell.teamId } },
        },
      });
      
      console.log(`Célula migrada: ${cell.name}`);
    } catch (error) {
      console.error(`Error migrando célula ${cell.name}:`, error);
    }
  }
  
  // Ahora creamos las relaciones entre analistas y células
  const analysts = await readJsonFile('analysts.txt');
  
  for (const analyst of analysts) {
    if (analyst.cellIds && analyst.cellIds.length > 0) {
      for (const cellId of analyst.cellIds) {
        try {
          await prisma.analystCell.upsert({
            where: {
              analystId_cellId: {
                analystId: analyst.id,
                cellId: cellId,
              },
            },
            update: {},
            create: {
              analyst: { connect: { id: analyst.id } },
              cell: { connect: { id: cellId } },
            },
          });
        } catch (error) {
          console.error(`Error creando relación analista-célula para ${analyst.name} y célula ${cellId}:`, error);
        }
      }
    }
  }
}

async function migrarPlanesPrueba() {
  console.log('Migrando planes de prueba...');
  const testPlans = await readJsonFile('test-plans.txt');
  
  for (const plan of testPlans) {
    try {
      await prisma.testPlan.upsert({
        where: { id: plan.id },
        update: {
          projectId: plan.projectId,
          projectName: plan.projectName,
          codeReference: plan.codeReference,
          startDate: plan.startDate ? new Date(plan.startDate) : null,
          endDate: plan.endDate ? new Date(plan.endDate) : null,
          estimatedHours: plan.estimatedHours || 0,
          estimatedDays: plan.estimatedDays || 0,
          totalCases: plan.totalCases || 0,
          testQuality: plan.testQuality || 0,
        },
        create: {
          id: plan.id,
          projectId: plan.projectId,
          projectName: plan.projectName,
          codeReference: plan.codeReference,
          startDate: plan.startDate ? new Date(plan.startDate) : null,
          endDate: plan.endDate ? new Date(plan.endDate) : null,
          estimatedHours: plan.estimatedHours || 0,
          estimatedDays: plan.estimatedDays || 0,
          totalCases: plan.totalCases || 0,
          testQuality: plan.testQuality || 0,
        },
      });
      
      // Migrar ciclos de prueba
      if (plan.cycles && plan.cycles.length > 0) {
        for (const cycle of plan.cycles) {
          await prisma.testCycle.upsert({
            where: { id: cycle.id },
            update: {
              number: cycle.number,
              designed: cycle.designed || 0,
              successful: cycle.successful || 0,
              notExecuted: cycle.notExecuted || 0,
              defects: cycle.defects || 0,
            },
            create: {
              id: cycle.id,
              number: cycle.number,
              designed: cycle.designed || 0,
              successful: cycle.successful || 0,
              notExecuted: cycle.notExecuted || 0,
              defects: cycle.defects || 0,
              testPlan: { connect: { id: plan.id } },
            },
          });
        }
      }
      
      console.log(`Plan de prueba migrado: ${plan.projectName} (${plan.codeReference})`);
    } catch (error) {
      console.error(`Error migrando plan de prueba ${plan.projectName}:`, error);
    }
  }
}

async function migrarCasosPrueba() {
  console.log('Migrando casos de prueba...');
  const testCases = await readJsonFile('test-cases.txt');
  
  for (const testCase of testCases) {
    try {
      await prisma.testCase.upsert({
        where: { id: testCase.id },
        update: {
          userStoryId: testCase.userStoryId || '',
          name: testCase.name,
          projectId: testCase.projectId || '',
          codeRef: testCase.codeRef || '',
          expectedResult: testCase.expectedResult || '',
          testPlanId: testCase.testPlanId,
        },
        create: {
          id: testCase.id,
          userStoryId: testCase.userStoryId || '',
          name: testCase.name,
          projectId: testCase.projectId || '',
          codeRef: testCase.codeRef || '',
          expectedResult: testCase.expectedResult || '',
          testPlan: { connect: { id: testCase.testPlanId } },
        },
      });
      
      // Migrar pasos del caso de prueba
      if (testCase.steps && testCase.steps.length > 0) {
        for (const step of testCase.steps) {
          await prisma.testStep.upsert({
            where: { id: step.id },
            update: {
              description: step.description,
              expected: step.expected || '',
            },
            create: {
              id: step.id,
              description: step.description,
              expected: step.expected || '',
              testCase: { connect: { id: testCase.id } },
            },
          });
        }
      }
      
      console.log(`Caso de prueba migrado: ${testCase.name}`);
    } catch (error) {
      console.error(`Error migrando caso de prueba ${testCase.name}:`, error);
    }
  }
}

async function migrarIncidentes() {
  console.log('Migrando incidentes...');
  const incidents = await readJsonFile('incidents.txt');
  
  for (const incident of incidents) {
    try {
      // Buscar la célula por nombre en lugar de ID
      let cellId = null;
      if (incident.celula) {
        const cells = await prisma.cell.findMany({
          where: {
            name: {
              contains: incident.celula,
              mode: 'insensitive'
            }
          }
        });
        
        if (cells.length > 0) {
          cellId = cells[0].id;
        }
      }
      
      // Buscar analistas por nombre
      let informadoPorId = null;
      let asignadoAId = null;
      
      if (incident.informadoPor) {
        const reporters = await prisma.qAAnalyst.findMany({
          where: {
            name: {
              contains: incident.informadoPor,
              mode: 'insensitive'
            }
          }
        });
        
        if (reporters.length > 0) {
          informadoPorId = reporters[0].id;
        }
      }
      
      if (incident.asignadoA) {
        const assignees = await prisma.qAAnalyst.findMany({
          where: {
            name: {
              contains: incident.asignadoA,
              mode: 'insensitive'
            }
          }
        });
        
        if (assignees.length > 0) {
          asignadoAId = assignees[0].id;
        }
      }
      
      // Si no encontramos el analista, usamos uno por defecto (el primero)
      if (!informadoPorId || !asignadoAId) {
        const defaultAnalyst = await prisma.qAAnalyst.findFirst();
        if (!informadoPorId && defaultAnalyst) informadoPorId = defaultAnalyst.id;
        if (!asignadoAId && defaultAnalyst) asignadoAId = defaultAnalyst.id;
      }
      
      await prisma.incident.upsert({
        where: { id: incident.id },
        update: {
          estado: incident.estado,
          prioridad: incident.prioridad,
          descripcion: incident.descripcion,
          fechaCreacion: incident.fechaCreacion ? new Date(incident.fechaCreacion) : new Date(),
          fechaReporte: incident.fechaReporte ? new Date(incident.fechaReporte) : new Date(),
          fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : null,
          diasAbierto: incident.diasAbierto || 0,
          esErroneo: incident.esErroneo || false,
          aplica: incident.aplica || true,
          cliente: incident.cliente || 'Desconocido',
          idJira: incident.idJira || '',
          tipoBug: incident.tipoBug,
          areaAfectada: incident.areaAfectada,
          celula: cellId,
          informadoPorId: informadoPorId,
          asignadoAId: asignadoAId,
        },
        create: {
          id: incident.id,
          estado: incident.estado,
          prioridad: incident.prioridad,
          descripcion: incident.descripcion,
          fechaCreacion: incident.fechaCreacion ? new Date(incident.fechaCreacion) : new Date(),
          fechaReporte: incident.fechaReporte ? new Date(incident.fechaReporte) : new Date(),
          fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : null,
          diasAbierto: incident.diasAbierto || 0,
          esErroneo: incident.esErroneo || false,
          aplica: incident.aplica || true,
          cliente: incident.cliente || 'Desconocido',
          idJira: incident.idJira || '',
          tipoBug: incident.tipoBug,
          areaAfectada: incident.areaAfectada,
          ...(cellId && { cell: { connect: { id: cellId } } }),
          ...(informadoPorId && { informadoPor: { connect: { id: informadoPorId } } }),
          ...(asignadoAId && { asignadoA: { connect: { id: asignadoAId } } }),
        },
      });
      
      console.log(`Incidente migrado: ${incident.id} (${incident.idJira})`);
    } catch (error) {
      console.error(`Error migrando incidente ${incident.id}:`, error);
    }
  }
}

async function migrarSeguimiento() {
  console.log('Migrando seguimiento de proyectos...');
  const seguimientos = await readJsonFile('seguimiento.txt');
  
  for (const seguimiento of seguimientos) {
    try {
      // Buscar equipo por nombre
      let equipoId = null;
      if (seguimiento.equipo) {
        const teams = await prisma.team.findMany({
          where: {
            name: {
              contains: seguimiento.equipo,
              mode: 'insensitive'
            }
          }
        });
        
        if (teams.length > 0) {
          equipoId = teams[0].id;
        }
      }
      
      // Buscar célula por nombre
      let celulaId = null;
      if (seguimiento.celula) {
        const cells = await prisma.cell.findMany({
          where: {
            name: {
              contains: seguimiento.celula,
              mode: 'insensitive'
            }
          }
        });
        
        if (cells.length > 0) {
          celulaId = cells[0].id;
        }
      }
      
      // Si no encontramos equipo o célula, usamos los primeros
      if (!equipoId) {
        const defaultTeam = await prisma.team.findFirst();
        if (defaultTeam) equipoId = defaultTeam.id;
      }
      
      if (!celulaId) {
        const defaultCell = await prisma.cell.findFirst();
        if (defaultCell) celulaId = defaultCell.id;
      }
      
      if (equipoId && celulaId) {
        await prisma.project.upsert({
          where: { 
            id: seguimiento.id || `proj-${seguimiento.idJira}-${Date.now()}` 
          },
          update: {
            idJira: seguimiento.idJira,
            proyecto: seguimiento.proyecto,
            horas: seguimiento.horas || 0,
            dias: seguimiento.dias || 0,
            fechaEntrega: seguimiento.fechaEntrega ? new Date(seguimiento.fechaEntrega) : null,
            fechaRealEntrega: seguimiento.fechaRealEntrega ? new Date(seguimiento.fechaRealEntrega) : null,
            fechaCertificacion: seguimiento.fechaCertificacion ? new Date(seguimiento.fechaCertificacion) : null,
            diasRetraso: seguimiento.diasRetraso || 0,
            analistaProducto: seguimiento.analistaProducto || '',
            planTrabajo: seguimiento.planTrabajo || '',
            equipoId: equipoId,
            celulaId: celulaId,
          },
          create: {
            id: seguimiento.id || `proj-${seguimiento.idJira}-${Date.now()}`,
            idJira: seguimiento.idJira,
            proyecto: seguimiento.proyecto,
            horas: seguimiento.horas || 0,
            dias: seguimiento.dias || 0,
            fechaEntrega: seguimiento.fechaEntrega ? new Date(seguimiento.fechaEntrega) : null,
            fechaRealEntrega: seguimiento.fechaRealEntrega ? new Date(seguimiento.fechaRealEntrega) : null,
            fechaCertificacion: seguimiento.fechaCertificacion ? new Date(seguimiento.fechaCertificacion) : null,
            diasRetraso: seguimiento.diasRetraso || 0,
            analistaProducto: seguimiento.analistaProducto || '',
            planTrabajo: seguimiento.planTrabajo || '',
            team: { connect: { id: equipoId } },
            cell: { connect: { id: celulaId } },
          },
        });
        
        console.log(`Proyecto migrado: ${seguimiento.idJira} (${seguimiento.proyecto})`);
      } else {
        console.warn(`No se pudo migrar el proyecto ${seguimiento.idJira} por falta de equipo o célula`);
      }
    } catch (error) {
      console.error(`Error migrando proyecto ${seguimiento.idJira}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('Iniciando migración de datos a PostgreSQL...');
    
    await migrarAnalistas();
    await migrarEquipos();
    await migrarCelulas();
    await migrarPlanesPrueba();
    await migrarCasosPrueba();
    await migrarIncidentes();
    await migrarSeguimiento();
    
    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();