/**
 * Script simplificado para verificar la consistencia entre las implementaciones de archivos y PostgreSQL
 * Este script accede directamente a los archivos y la base de datos en lugar de usar los servicios.
 */

const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Función para comparar dos arrays de objetos y encontrar diferencias
 * @param fileData Datos de la implementación de archivos
 * @param prismaData Datos de la implementación de PostgreSQL
 * @param keyField Campo clave para comparar objetos
 * @returns Objeto con información de diferencias
 */
function compareDataSets(fileData, prismaData, keyField = 'id') {
  const fileIds = new Set(fileData.map(item => item[keyField]));
  const prismaIds = new Set(prismaData.map(item => item[keyField]));
  
  // Elementos en archivos pero no en Prisma
  const onlyInFile = [...fileIds].filter(id => !prismaIds.has(id));
  
  // Elementos en Prisma pero no en archivos
  const onlyInPrisma = [...prismaIds].filter(id => !fileIds.has(id));
  
  // Elementos en ambos pero con diferencias
  const inBoth = [];
  
  // Comparar elementos que existen en ambos lugares
  fileData.forEach(fileItem => {
    if (prismaIds.has(fileItem[keyField])) {
      const prismaItem = prismaData.find(item => item[keyField] === fileItem[keyField]);
      
      // Verificar si hay diferencias en los campos
      const differences = {};
      let hasDifferences = false;
      
      Object.keys(fileItem).forEach(key => {
        // Ignorar campos que son arrays u objetos complejos
        if (typeof fileItem[key] !== 'object' && fileItem[key] !== prismaItem[key]) {
          differences[key] = {
            file: fileItem[key],
            prisma: prismaItem[key]
          };
          hasDifferences = true;
        }
      });
      
      if (hasDifferences) {
        inBoth.push({
          id: fileItem[keyField],
          differences
        });
      }
    }
  });
  
  return {
    total: {
      file: fileIds.size,
      prisma: prismaIds.size
    },
    onlyInFile,
    onlyInPrisma,
    inBoth,
    isConsistent: onlyInFile.length === 0 && onlyInPrisma.length === 0 && inBoth.length === 0
  };
}

/**
 * Leer datos de un archivo
 * @param {string} fileName Nombre del archivo en carpeta data
 * @returns {Array} Datos del archivo
 */
async function readFileData(fileName) {
  try {
    const filePath = path.join(process.cwd(), 'data', fileName);
    console.log(`Leyendo archivo: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error leyendo ${fileName}:`, error);
    return [];
  }
}

/**
 * Función principal que ejecuta las verificaciones
 */
async function verifyMigration() {
  console.log('🔍 Iniciando verificación simplificada entre archivos y PostgreSQL...\n');
  
  try {
    // Crear la carpeta para resultados
    await ensureVerificationDir();
    
    // 1. Verificar analistas
    console.log('🧪 Verificando QA Analysts...');
    const fileAnalysts = await readFileData('analysts.txt');
    const prismaAnalysts = await prisma.qAAnalyst.findMany();
    
    const analystsComparison = compareDataSets(fileAnalysts, prismaAnalysts);
    console.log(`Total analistas: ${analystsComparison.total.file} en archivos, ${analystsComparison.total.prisma} en PostgreSQL`);
    console.log(`Consistencia: ${analystsComparison.isConsistent ? '✅ OK' : '❌ Diferencias encontradas'}`);
    
    if (!analystsComparison.isConsistent) {
      console.log(`Solo en archivos: ${analystsComparison.onlyInFile.length}`);
      console.log(`Solo en PostgreSQL: ${analystsComparison.onlyInPrisma.length}`);
      console.log(`Con diferencias: ${analystsComparison.inBoth.length}`);
      
      // Guardar detalles en un archivo para análisis
      await fs.writeFile(
        path.join(process.cwd(), 'migration-verification', 'analysts.json'), 
        JSON.stringify(analystsComparison, null, 2)
      );
    }
      // 2. Verificar equipos
    console.log('\n🧪 Verificando Teams...');
    const fileTeams = await readFileData('teams.txt');
    
    // Obtener equipos con sus analistas relacionados
    const prismaTeams = await prisma.team.findMany({
      include: {
        analysts: {
          include: {
            analyst: true
          }
        }
      }
    });
      // Transformar los equipos de Prisma para que coincidan con la estructura de los archivos
    const formattedPrismaTeams = prismaTeams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      members: team.analysts.map(rel => rel.analystId)
    }));
    
    const teamsComparison = compareDataSets(fileTeams, formattedPrismaTeams);
    console.log(`Total equipos: ${teamsComparison.total.file} en archivos, ${teamsComparison.total.prisma} en PostgreSQL`);
    console.log(`Consistencia: ${teamsComparison.isConsistent ? '✅ OK' : '❌ Diferencias encontradas'}`);
    
    if (!teamsComparison.isConsistent) {
      console.log(`Solo en archivos: ${teamsComparison.onlyInFile.length}`);
      console.log(`Solo en PostgreSQL: ${teamsComparison.onlyInPrisma.length}`);
      console.log(`Con diferencias: ${teamsComparison.inBoth.length}`);
      
      // Guardar detalles en un archivo para análisis
      await fs.writeFile(
        path.join(process.cwd(), 'migration-verification', 'teams.json'), 
        JSON.stringify(teamsComparison, null, 2)
      );
    }
    
    // 3. Verificar células
    console.log('\n🧪 Verificando Cells...');
    const fileCells = await readFileData('cells.txt');
    const prismaCells = await prisma.cell.findMany();
    
    const cellsComparison = compareDataSets(fileCells, prismaCells);
    console.log(`Total células: ${cellsComparison.total.file} en archivos, ${cellsComparison.total.prisma} en PostgreSQL`);
    console.log(`Consistencia: ${cellsComparison.isConsistent ? '✅ OK' : '❌ Diferencias encontradas'}`);
    
    if (!cellsComparison.isConsistent) {
      await fs.writeFile(
        path.join(process.cwd(), 'migration-verification', 'cells.json'),
        JSON.stringify(cellsComparison, null, 2)
      );
    }
    
    // 4. Verificar casos de prueba
    console.log('\n🧪 Verificando Test Cases...');
    const fileTestCases = await readFileData('test-cases.txt');
    const prismaTestCases = await prisma.testCase.findMany();
    
    const testCasesComparison = compareDataSets(fileTestCases, prismaTestCases);
    console.log(`Total casos: ${testCasesComparison.total.file} en archivos, ${testCasesComparison.total.prisma} en PostgreSQL`);
    console.log(`Consistencia: ${testCasesComparison.isConsistent ? '✅ OK' : '❌ Diferencias encontradas'}`);
    
    if (!testCasesComparison.isConsistent) {
      await fs.writeFile(
        path.join(process.cwd(), 'migration-verification', 'test-cases.json'),
        JSON.stringify(testCasesComparison, null, 2)
      );
    }
    
    // 5. Verificar planes de prueba
    console.log('\n🧪 Verificando Test Plans...');
    const fileTestPlans = await readFileData('test-plans.txt');
    const prismaTestPlans = await prisma.testPlan.findMany();
    
    const testPlansComparison = compareDataSets(fileTestPlans, prismaTestPlans);
    console.log(`Total planes: ${testPlansComparison.total.file} en archivos, ${testPlansComparison.total.prisma} en PostgreSQL`);
    console.log(`Consistencia: ${testPlansComparison.isConsistent ? '✅ OK' : '❌ Diferencias encontradas'}`);
    
    if (!testPlansComparison.isConsistent) {
      await fs.writeFile(
        path.join(process.cwd(), 'migration-verification', 'test-plans.json'),
        JSON.stringify(testPlansComparison, null, 2)
      );
    }
    
    // 6. Verificar incidentes
    console.log('\n🧪 Verificando Incidents...');
    const fileIncidents = await readFileData('incidents.txt');
    const prismaIncidents = await prisma.incident.findMany();
    
    const incidentsComparison = compareDataSets(fileIncidents, prismaIncidents);
    console.log(`Total incidentes: ${incidentsComparison.total.file} en archivos, ${incidentsComparison.total.prisma} en PostgreSQL`);
    console.log(`Consistencia: ${incidentsComparison.isConsistent ? '✅ OK' : '❌ Diferencias encontradas'}`);
    
    if (!incidentsComparison.isConsistent) {
      await fs.writeFile(
        path.join(process.cwd(), 'migration-verification', 'incidents.json'),
        JSON.stringify(incidentsComparison, null, 2)
      );
    }
    
    console.log('\n✅ Verificación completa. Ver carpeta migration-verification para detalles.');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Asegurar que existe la carpeta para guardar resultados
async function ensureVerificationDir() {
  const dir = path.join(process.cwd(), 'migration-verification');
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir);
  }
}

// Ejecutar verificación
verifyMigration();
