// Script para limpiar todos los proyectos de la base de datos PostgreSQL
// y migrarlos nuevamente desde el archivo seguimiento.txt
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Rutas a los archivos de datos
const DATA_FOLDER = path.join(process.cwd(), 'data');
const SEGUIMIENTO_FILE = path.join(DATA_FOLDER, 'seguimiento.txt');

/**
 * Lee un archivo JSON
 */
async function readJsonFile(filename) {
  try {
    const data = await fs.readFile(path.join(DATA_FOLDER, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo el archivo ${filename}:`, error);
    return [];
  }
}

/**
 * Función para eliminar todos los proyectos de la base de datos
 */
async function limpiarProyectos() {
  console.log('🗑️ Eliminando todos los proyectos de la base de datos PostgreSQL...');
  
  try {
    // Primero eliminamos todas las relaciones ProjectAnalyst
    const eliminadosRelaciones = await prisma.projectAnalyst.deleteMany({});
    console.log(`✅ Eliminadas ${eliminadosRelaciones.count} relaciones de analistas con proyectos.`);
    
    // Luego eliminamos todos los proyectos
    const eliminados = await prisma.project.deleteMany({});
    console.log(`✅ Eliminados ${eliminados.count} proyectos de la base de datos.`);
    
    return eliminados.count;
  } catch (error) {
    console.error('❌ Error al eliminar proyectos:', error);
    throw error;
  }
}

/**
 * Función para crear un equipo si no existe
 */
async function asegurarEquipo(nombreEquipo) {
  if (!nombreEquipo) return null;
  
  try {
    // Buscar equipo existente por nombre
    let team = await prisma.team.findFirst({
      where: {
        name: {
          contains: nombreEquipo,
          mode: 'insensitive'
        }
      }
    });
    
    // Si no existe, crear nuevo equipo
    if (!team) {
      console.log(`🆕 Creando equipo: ${nombreEquipo}`);
      team = await prisma.team.create({
        data: {
          id: crypto.randomUUID(),
          name: nombreEquipo,
          description: `Equipo ${nombreEquipo} creado automáticamente`
        }
      });
    }
    
    return team.id;
  } catch (error) {
    console.error(`❌ Error al asegurar equipo ${nombreEquipo}:`, error);
    return null;
  }
}

/**
 * Función para crear una célula si no existe
 */
async function asegurarCelula(nombreCelula, equipoId) {
  if (!nombreCelula || !equipoId) return null;
  
  try {
    // Buscar célula existente por nombre
    let cell = await prisma.cell.findFirst({
      where: {
        name: {
          contains: nombreCelula,
          mode: 'insensitive'
        }
      }
    });
    
    // Si no existe, crear nueva célula
    if (!cell) {
      console.log(`🆕 Creando célula: ${nombreCelula}`);
      cell = await prisma.cell.create({
        data: {
          id: crypto.randomUUID(),
          name: nombreCelula,
          description: `Célula ${nombreCelula} creada automáticamente`,
          teamId: equipoId
        }
      });
    }
    
    return cell.id;
  } catch (error) {
    console.error(`❌ Error al asegurar célula ${nombreCelula}:`, error);
    return null;
  }
}

/**
 * Función para migrar los proyectos desde el archivo seguimiento.txt
 */
async function migrarProyectos() {
  console.log('📥 Migrando proyectos desde seguimiento.txt...');
  const seguimientos = await readJsonFile('seguimiento.txt');
  
  let proyectosMigrados = 0;
  let proyectosConError = 0;
  const proyectosUnicos = new Map(); // Para evitar duplicados por idJira
  
  // Primero filtramos para quedarnos con proyectos únicos (por idJira)
  for (const proyecto of seguimientos) {
    // Normalizar el idJira para evitar diferencias como KOIN256 vs KOIN-256
    const idJiraNormalizado = proyecto.idJira.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (!proyectosUnicos.has(idJiraNormalizado)) {
      proyectosUnicos.set(idJiraNormalizado, proyecto);
    } else {
      console.log(`⚠️ Proyecto duplicado encontrado: ${proyecto.idJira} (${proyecto.proyecto}). Se usará la primera ocurrencia.`);
    }
  }
  
  console.log(`ℹ️ Total proyectos únicos a migrar: ${proyectosUnicos.size}`);
  
  // Ahora migramos solo los proyectos únicos
  for (const [idJiraNormalizado, proyecto] of proyectosUnicos) {
    try {      // Asegurar que exista el equipo (crear si no existe)
      const equipoId = await asegurarEquipo(proyecto.equipo);
      
      // Asegurar que exista la célula (crear si no existe)
      const celulaId = await asegurarCelula(proyecto.celula, equipoId);
      
      // Si tenemos equipo y célula, crear el proyecto
      if (equipoId && celulaId) {
        // Generar un ID único para el proyecto
        const proyectoId = crypto.randomUUID();
        
        await prisma.project.create({
          data: {
            id: proyectoId,
            idJira: proyecto.idJira,
            nombre: proyecto.nombre || null,
            proyecto: proyecto.proyecto,
            equipoId: equipoId,
            celulaId: celulaId,
            horas: proyecto.horas || 0,
            dias: proyecto.dias || 0,
            horasEstimadas: proyecto.horasEstimadas || null,
            estado: proyecto.estado || null,
            estadoCalculado: proyecto.estadoCalculado || null,
            descripcion: proyecto.descripcion || null,
            fechaInicio: proyecto.fechaInicio ? new Date(proyecto.fechaInicio) : null,
            fechaFin: proyecto.fechaFin ? new Date(proyecto.fechaFin) : null,
            fechaEntrega: proyecto.fechaEntrega ? new Date(proyecto.fechaEntrega) : new Date(),
            fechaRealEntrega: proyecto.fechaRealEntrega ? new Date(proyecto.fechaRealEntrega) : null,
            fechaCertificacion: proyecto.fechaCertificacion ? new Date(proyecto.fechaCertificacion) : null,
            diasRetraso: proyecto.diasRetraso || 0,
            analistaProducto: proyecto.analistaProducto || '',
            planTrabajo: proyecto.planTrabajo || '',
          },
        });
        
        console.log(`✅ Proyecto migrado: ${proyecto.idJira} (${proyecto.proyecto})`);
        proyectosMigrados++;
      } else {
        console.warn(`⚠️ No se pudo migrar el proyecto ${proyecto.idJira} por falta de equipo (${equipoId ? 'Encontrado' : 'No encontrado'}) o célula (${celulaId ? 'Encontrada' : 'No encontrada'})`);
        proyectosConError++;
      }
    } catch (error) {
      console.error(`❌ Error migrando proyecto ${proyecto.idJira}:`, error);
      proyectosConError++;
    }
  }
  
  return { migrados: proyectosMigrados, conError: proyectosConError };
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔄 Iniciando limpieza y migración de proyectos...');
    
    // Paso 1: Limpiar proyectos existentes
    const proyectosEliminados = await limpiarProyectos();
    
    // Paso 2: Migrar proyectos desde archivo
    const { migrados, conError } = await migrarProyectos();
    
    console.log('\n📊 Resumen del proceso:');
    console.log(`   - ${proyectosEliminados} proyectos eliminados de la base de datos`);
    console.log(`   - ${migrados} proyectos migrados correctamente`);
    console.log(`   - ${conError} proyectos no se pudieron migrar`);
    
    console.log('\n✨ Proceso completado.');
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
main();
