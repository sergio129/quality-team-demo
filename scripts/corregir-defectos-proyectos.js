// Script para corregir la asignación de defectos con idJira de proyecto
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirAsignacionProyectos() {
  console.log('=== CORRECCIÓN DE DEFECTOS ASOCIADOS A PROYECTOS ===\n');
  
  try {
    // 1. Buscar incidentes cuyo idJira sea igual a un ID de proyecto (sin -T###)
    const incidentes = await prisma.incident.findMany({
      where: {
        idJira: {
          contains: 'SRCA-6556'
        },
        NOT: {
          idJira: {
            contains: '-T'
          }
        }
      },
      include: {
        testCases: {
          include: {
            testCase: true
          }
        }
      }
    });
    
    console.log(`Encontrados ${incidentes.length} incidentes con idJira de proyecto.\n`);
    
    for (const incidente of incidentes) {
      console.log(`Procesando incidente: ${incidente.id} (${incidente.idJira})`);
      console.log(`  - Casos asociados: ${incidente.testCases.length}`);
      
      // Si el incidente está asociado a múltiples casos, eliminar todas las relaciones
      if (incidente.testCases.length > 1) {
        // Recopilar IDs de los casos para después actualizar su estado
        const casosIds = incidente.testCases.map(rel => rel.testCase.id);
        
        // Eliminar las relaciones
        await prisma.defectRelation.deleteMany({
          where: {
            incidentId: incidente.id
          }
        });
        
        console.log(`  ✓ Eliminadas ${incidente.testCases.length} relaciones incorrectas`);
        
        // Actualizar el estado de los casos a "No ejecutado" si ya no tienen defectos
        for (const casoId of casosIds) {
          // Verificar si el caso aún tiene defectos después de eliminar la relación
          const defectosRestantes = await prisma.defectRelation.findMany({
            where: {
              testCaseId: casoId
            }
          });
          
          // Si ya no tiene defectos, cambiar estado a "No ejecutado"
          if (defectosRestantes.length === 0) {
            await prisma.testCase.update({
              where: { id: casoId },
              data: {
                status: 'No ejecutado',
                updatedAt: new Date()
              }
            });
            console.log(`  ✓ Caso ${casoId}: Estado actualizado a "No ejecutado"`);
          }
        }
      } else {
        console.log(`  ✓ No se requieren cambios (solo hay ${incidente.testCases.length} caso asociado)`);
      }
    }
    
    // 2. Verificar el resultado después de los cambios
    console.log('\n=== VERIFICACIÓN FINAL ===\n');
    
    const casosPrueba = await prisma.testCase.findMany({
      where: {
        projectId: 'SRCA-6556'
      },
      include: {
        defects: true
      }
    });
    
    console.log(`Estado final de casos de prueba del proyecto SRCA-6556:`);
    for (const caso of casosPrueba) {
      console.log(`- Caso ${caso.codeRef}: ${caso.defects.length} defectos, estado "${caso.status || 'No definido'}"`);
    }
    
  } catch (error) {
    console.error('Error al corregir asignación de defectos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirAsignacionProyectos().catch(error => {
  console.error('Error al ejecutar la corrección:', error);
});
