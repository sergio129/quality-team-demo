// Script para verificar la correcta migración de datos a PostgreSQL
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

async function verifyAnalysts() {
  const fileAnalysts = await readJsonFile('analysts.txt');
  const dbAnalysts = await prisma.qAAnalyst.findMany();
  
  console.log('=== Verificación de Analistas ===');
  console.log(`Total en archivos: ${fileAnalysts.length}`);
  console.log(`Total en base de datos: ${dbAnalysts.length}`);
  
  // Verificar que todos los IDs de los analistas en el archivo estén en la BD
  const fileAnalystIds = new Set(fileAnalysts.map(a => a.id));
  const dbAnalystIds = new Set(dbAnalysts.map(a => a.id));
  
  const missingIds = [...fileAnalystIds].filter(id => !dbAnalystIds.has(id));
  
  if (missingIds.length > 0) {
    console.log(`⚠️ Advertencia: ${missingIds.length} analistas del archivo no están en la base de datos.`);
    console.log('IDs faltantes:', missingIds);
  } else {
    console.log('✅ Todos los analistas han sido migrados correctamente.');
  }
}

async function verifyTeams() {
  const fileTeams = await readJsonFile('teams.txt');
  const dbTeams = await prisma.team.findMany();
  
  console.log('\n=== Verificación de Equipos ===');
  console.log(`Total en archivos: ${fileTeams.length}`);
  console.log(`Total en base de datos: ${dbTeams.length}`);
  
  // Verificar que todos los IDs de los equipos en el archivo estén en la BD
  const fileTeamIds = new Set(fileTeams.map(t => t.id));
  const dbTeamIds = new Set(dbTeams.map(t => t.id));
  
  const missingIds = [...fileTeamIds].filter(id => !dbTeamIds.has(id));
  
  if (missingIds.length > 0) {
    console.log(`⚠️ Advertencia: ${missingIds.length} equipos del archivo no están en la base de datos.`);
    console.log('IDs faltantes:', missingIds);
  } else {
    console.log('✅ Todos los equipos han sido migrados correctamente.');
  }
}

async function verifyCells() {
  const fileCells = await readJsonFile('cells.txt');
  const dbCells = await prisma.cell.findMany();
  
  console.log('\n=== Verificación de Células ===');
  console.log(`Total en archivos: ${fileCells.length}`);
  console.log(`Total en base de datos: ${dbCells.length}`);
  
  // Verificar que todos los IDs de las células en el archivo estén en la BD
  const fileCellIds = new Set(fileCells.map(c => c.id));
  const dbCellIds = new Set(dbCells.map(c => c.id));
  
  const missingIds = [...fileCellIds].filter(id => !dbCellIds.has(id));
  
  if (missingIds.length > 0) {
    console.log(`⚠️ Advertencia: ${missingIds.length} células del archivo no están en la base de datos.`);
    console.log('IDs faltantes:', missingIds);
  } else {
    console.log('✅ Todas las células han sido migradas correctamente.');
  }
}

async function verifyTestPlans() {
  const filePlans = await readJsonFile('test-plans.txt');
  const dbPlans = await prisma.testPlan.findMany();
  
  console.log('\n=== Verificación de Planes de Prueba ===');
  console.log(`Total en archivos: ${filePlans.length}`);
  console.log(`Total en base de datos: ${dbPlans.length}`);
  
  // Verificar que todos los IDs de los planes en el archivo estén en la BD
  const filePlanIds = new Set(filePlans.map(p => p.id));
  const dbPlanIds = new Set(dbPlans.map(p => p.id));
  
  const missingIds = [...filePlanIds].filter(id => !dbPlanIds.has(id));
  
  if (missingIds.length > 0) {
    console.log(`⚠️ Advertencia: ${missingIds.length} planes de prueba del archivo no están en la base de datos.`);
    console.log('IDs faltantes:', missingIds);
  } else {
    console.log('✅ Todos los planes de prueba han sido migrados correctamente.');
  }
}

async function verifyTestCases() {
  const fileCases = await readJsonFile('test-cases.txt');
  const dbCases = await prisma.testCase.findMany();
  
  console.log('\n=== Verificación de Casos de Prueba ===');
  console.log(`Total en archivos: ${fileCases.length}`);
  console.log(`Total en base de datos: ${dbCases.length}`);
  
  // Verificar que todos los IDs de los casos en el archivo estén en la BD
  const fileCaseIds = new Set(fileCases.map(c => c.id));
  const dbCaseIds = new Set(dbCases.map(c => c.id));
  
  const missingIds = [...fileCaseIds].filter(id => !dbCaseIds.has(id));
  
  if (missingIds.length > 0) {
    console.log(`⚠️ Advertencia: ${missingIds.length} casos de prueba del archivo no están en la base de datos.`);
    console.log('IDs faltantes:', missingIds);
  } else {
    console.log('✅ Todos los casos de prueba han sido migrados correctamente.');
  }
}

async function verifyIncidents() {
  const fileIncidents = await readJsonFile('incidents.txt');
  const dbIncidents = await prisma.incident.findMany();
  
  console.log('\n=== Verificación de Incidentes ===');
  console.log(`Total en archivos: ${fileIncidents.length}`);
  console.log(`Total en base de datos: ${dbIncidents.length}`);
  
  // Verificar que todos los IDs de los incidentes en el archivo estén en la BD
  const fileIncidentIds = new Set(fileIncidents.map(i => i.id));
  const dbIncidentIds = new Set(dbIncidents.map(i => i.id));
  
  const missingIds = [...fileIncidentIds].filter(id => !dbIncidentIds.has(id));
  
  if (missingIds.length > 0) {
    console.log(`⚠️ Advertencia: ${missingIds.length} incidentes del archivo no están en la base de datos.`);
    console.log('IDs faltantes:', missingIds);
  } else {
    console.log('✅ Todos los incidentes han sido migrados correctamente.');
  }
}

async function main() {
  try {
    console.log('📊 Iniciando verificación de datos en PostgreSQL...\n');
    
    await verifyAnalysts();
    await verifyTeams();
    await verifyCells();
    await verifyTestPlans();
    await verifyTestCases();
    await verifyIncidents();
    
    console.log('\n✨ Verificación completa.');
  } catch (error) {
    console.error('Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();