// Script para verificar los defectos asociados a los casos de prueba del proyecto SRCA-6556
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarCasosPruebaSRCA6556() {
  console.log('=== VERIFICACIÓN DE CASOS DE PRUEBA PROYECTO SRCA-6556 ===\n');
  
  try {
    // Obtener los casos de prueba del proyecto específico
    const casosPrueba = await prisma.testCase.findMany({
      where: {
        projectId: 'SRCA-6556'
      },
      include: {
        defects: {
          include: {
            incident: true
          }
        }
      }
    });
    
    console.log(`Encontrados ${casosPrueba.length} casos de prueba para el proyecto SRCA-6556.\n`);
    
    // Mostrar detalles de cada caso y sus defectos
    for (const caso of casosPrueba) {
      console.log(`Caso: ${caso.codeRef} (${caso.id})`);
      console.log(`  - Estado: ${caso.status || 'No definido'}`);
      console.log(`  - Defectos: ${caso.defects.length}`);
      
      // Si tiene defectos, mostrar detalles
      if (caso.defects.length > 0) {
        for (const defecto of caso.defects) {
          console.log(`  - Defecto: ${defecto.incident.id} (${defecto.incident.idJira})`);
          console.log(`    - Estado: ${defecto.incident.estado}`);
          console.log(`    - Descripción: ${defecto.incident.descripcion.substring(0, 100)}${defecto.incident.descripcion.length > 100 ? '...' : ''}`);
        }
      }
      
      console.log();
    }
    
    // Verificar si hay defectos con idJira SRCA-6556* que podrían estar mal asignados
    console.log('\n=== VERIFICACIÓN DE INCIDENTES RELACIONADOS CON SRCA-6556 ===\n');
    
    const incidentes = await prisma.incident.findMany({
      where: {
        idJira: {
          contains: 'SRCA-6556'
        }
      },
      include: {
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                codeRef: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Encontrados ${incidentes.length} incidentes con idJira que contiene 'SRCA-6556'.\n`);
    
    // Mostrar detalles de cada incidente y sus casos de prueba asociados
    for (const incidente of incidentes) {
      console.log(`Incidente: ${incidente.id} (${incidente.idJira})`);
      console.log(`  - Estado: ${incidente.estado}`);
      console.log(`  - Descripción: ${incidente.descripcion.substring(0, 100)}${incidente.descripcion.length > 100 ? '...' : ''}`);
      console.log(`  - Casos de prueba asociados: ${incidente.testCases.length}`);
      
      // Si tiene casos asociados, mostrar detalles
      if (incidente.testCases.length > 0) {
        for (const relacion of incidente.testCases) {
          console.log(`    - Caso: ${relacion.testCase.codeRef} (${relacion.testCase.id})`);
          console.log(`      - Estado: ${relacion.testCase.status || 'No definido'}`);
        }
      }
      
      console.log();
    }

  } catch (error) {
    console.error('Error al verificar casos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
verificarCasosPruebaSRCA6556().catch(error => {
  console.error('Error al ejecutar la verificación:', error);
});
