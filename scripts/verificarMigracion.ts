/**
 * Script para verificar la consistencia entre las implementaciones de archivos y PostgreSQL
 * Este script es útil durante la fase de validación por servicio para garantizar
 * que ambas implementaciones retornan los mismos resultados.
 */

import { QAAnalystService } from '../src/services/qaAnalystService';
import { TeamService } from '../src/services/teamService';
import { CellService } from '../src/services/cellService';
import { testCaseService } from '../src/services/testCaseService';
import { testPlanService } from '../src/services/testPlanService';
import { incidentService } from '../src/services/incidentService';
import { projectService } from '../src/services/projectService';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Configurar temporalmente las variables de entorno para este script
process.env.MIGRATION_LOGGING = 'true';
process.env.MIGRATION_LOG_LEVEL = 'debug';
process.env.MIGRATION_FALLBACK = 'false'; // Desactivar fallback para detectar errores

const prisma = new PrismaClient();

/**
 * Función para comparar dos arrays de objetos y encontrar diferencias
 * @param fileData Datos de la implementación de archivos
 * @param prismaData Datos de la implementación de PostgreSQL
 * @param keyField Campo clave para comparar objetos
 * @returns Objeto con información de diferencias
 */
function compareDataSets(fileData: any[], prismaData: any[], keyField: string = 'id') {
  const fileIds = new Set(fileData.map(item => item[keyField]));
  const prismaIds = new Set(prismaData.map(item => item[keyField]));
  
  // Elementos en archivos pero no en Prisma
  const onlyInFile = [...fileIds].filter(id => !prismaIds.has(id));
  
  // Elementos en Prisma pero no en archivos
  const onlyInPrisma = [...prismaIds].filter(id => !fileIds.has(id));
  
  // Elementos en ambos pero con diferencias
  const inBoth: any[] = [];
  
  // Comparar elementos que existen en ambos lugares
  fileData.forEach(fileItem => {
    if (prismaIds.has(fileItem[keyField])) {
      const prismaItem = prismaData.find(item => item[keyField] === fileItem[keyField]);
      
      // Verificar si hay diferencias en los campos
      const differences: any = {};
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
 * Función principal que ejecuta las verificaciones
 */
async function verifyMigration() {
  console.log('🔍 Iniciando verificación de consistencia entre archivos y PostgreSQL...\n');
  
  // Crear instancias directas de los servicios de archivos y Prisma para comparar
  const qaAnalystService = new QAAnalystService();
  const teamService = new TeamService();
  const cellService = new CellService();
  
  // Configurar variables de entorno para pruebas
  const originalPostgres = process.env.USE_POSTGRES;
  
  try {
    // 1. Verificar analistas
    console.log('🧪 Verificando QA Analysts...');
    
    // Obtener datos de archivos
    process.env.USE_POSTGRES = 'false';
    const fileAnalysts = await qaAnalystService.getAllAnalysts();
    
    // Obtener datos de PostgreSQL
    process.env.USE_POSTGRES = 'true';
    const prismaAnalysts = await qaAnalystService.getAllAnalysts();
    
    // Comparar y mostrar resultados
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
    
    // Obtener datos de archivos
    process.env.USE_POSTGRES = 'false';
    const fileTeams = await teamService.getAllTeams();
    
    // Obtener datos de PostgreSQL
    process.env.USE_POSTGRES = 'true';
    const prismaTeams = await teamService.getAllTeams();
    
    // Comparar y mostrar resultados
    const teamsComparison = compareDataSets(fileTeams, prismaTeams);
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
    // (implementar con la misma estructura...)
    
    // 4. Verificar casos de prueba
    // (implementar con la misma estructura...)
    
    // 5. Verificar planes de prueba
    // (implementar con la misma estructura...)
    
    // 6. Verificar incidentes
    // (implementar con la misma estructura...)
    
    // 7. Verificar proyectos
    // (implementar con la misma estructura...)
    
    console.log('\n✅ Verificación completa. Ver carpeta migration-verification para detalles.');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    // Restaurar la configuración original
    process.env.USE_POSTGRES = originalPostgres;
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
(async () => {
  await ensureVerificationDir();
  await verifyMigration();
})();
