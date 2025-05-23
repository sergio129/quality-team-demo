// Script para verificar la correcta asignación de relaciones entre incidentes y casos de prueba
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarAsignacionDefectos() {
  console.log('=== VERIFICACIÓN DE ASIGNACIÓN DE DEFECTOS A CASOS DE PRUEBA ===\n');
  
  try {
    // 1. Obtener todos los incidentes con su idJira
    const incidentes = await prisma.incident.findMany({
      select: {
        id: true,
        idJira: true,
        descripcion: true,
        estado: true,
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                codeRef: true,
                projectId: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Encontrados ${incidentes.length} incidentes en total.\n`);
    
    // 2. Obtener todos los casos de prueba con sus códigos de referencia
    const casosPrueba = await prisma.testCase.findMany({
      select: {
        id: true,
        codeRef: true,
        projectId: true,
        name: true,
        status: true,
        defects: {
          include: {
            incident: true
          }
        }
      }
    });
    
    console.log(`Encontrados ${casosPrueba.length} casos de prueba en total.\n`);
    
    // 3. Verificar incidentes que deberían estar relacionados con un caso de prueba según su idJira
    console.log('=== POSIBLES INCIDENTES MAL ASIGNADOS ===\n');
    
    let incidentesParaReasignar = [];
    
    for (const incidente of incidentes) {
      // Si el incidente tiene un idJira que parece ser un código de referencia de caso de prueba
      if (incidente.idJira && (incidente.idJira.includes('-T') || /T\d+$/.test(incidente.idJira))) {
        // Buscar el caso de prueba que debería corresponder a ese incidente
        const casoCoincidente = casosPrueba.find(caso => 
          caso.codeRef === incidente.idJira ||
          `${caso.projectId}-${caso.codeRef}` === incidente.idJira ||
          caso.codeRef === incidente.idJira.replace(/^.*-/, '')
        );
        
        // Si encontramos un caso que corresponde pero no está relacionado
        if (casoCoincidente && !incidente.testCases.some(tc => tc.testCase.id === casoCoincidente.id)) {
          console.log(`Incidente ${incidente.id} (idJira: ${incidente.idJira}) debería estar relacionado con el caso ${casoCoincidente.codeRef}`);
          console.log(`  - Descripción incidente: ${incidente.descripcion.substring(0, 100)}${incidente.descripcion.length > 100 ? '...' : ''}`);
          console.log(`  - Caso de prueba: ${casoCoincidente.name.substring(0, 100)}${casoCoincidente.name.length > 100 ? '...' : ''}`);
          console.log();
          
          incidentesParaReasignar.push({
            incidenteId: incidente.id,
            testCaseId: casoCoincidente.id,
            codeRef: casoCoincidente.codeRef
          });
        }
      }
    }
    
    // 4. Verificar casos de prueba que tienen múltiples defectos asignados incorrectamente
    console.log('\n=== CASOS DE PRUEBA CON DEFECTOS POSIBLEMENTE MAL ASIGNADOS ===\n');
    
    for (const caso of casosPrueba) {
      if (caso.defects && caso.defects.length > 0) {
        // Filtrar los defectos que tienen un idJira que no coincide con este caso
        const defectosIncorrectos = caso.defects.filter(defect => {
          // Sólo verificar si el defecto tiene un idJira definido que parece ser un código de caso
          if (!defect.incident.idJira || !defect.incident.idJira.includes('-T')) {
            return false;
          }
          
          // Verificar si el idJira coincide con este caso
          const coincide = 
            defect.incident.idJira === caso.codeRef ||
            defect.incident.idJira === `${caso.projectId}-${caso.codeRef}` ||
            defect.incident.idJira.includes(caso.codeRef);
          
          // Si no coincide, podría estar mal asignado
          return !coincide;
        });
        
        if (defectosIncorrectos.length > 0) {
          console.log(`Caso de prueba ${caso.codeRef} tiene ${defectosIncorrectos.length} defectos posiblemente mal asignados:`);
          
          defectosIncorrectos.forEach(defect => {
            console.log(`  - Defecto ${defect.incident.id} (idJira: ${defect.incident.idJira})`);
            console.log(`    Descripción: ${defect.incident.descripcion.substring(0, 100)}${defect.incident.descripcion.length > 100 ? '...' : ''}`);
            
            // Buscar el caso que debería tener este defecto según su idJira
            const casoCorrespondiente = casosPrueba.find(c => 
              c.codeRef === defect.incident.idJira ||
              `${c.projectId}-${c.codeRef}` === defect.incident.idJira ||
              defect.incident.idJira.includes(c.codeRef)
            );
            
            if (casoCorrespondiente) {
              console.log(`    Debería estar asignado a: ${casoCorrespondiente.codeRef}`);
            }
          });
          
          console.log();
        }
      }
    }
    
    // 5. Preguntar si se quieren crear las relaciones faltantes
    console.log(`\nSe encontraron ${incidentesParaReasignar.length} incidentes para reasignar.`);
    
    // Si hay incidentes para reasignar, mostrar un resumen
    if (incidentesParaReasignar.length > 0) {
      console.log('\nResumen de relaciones faltantes:');
      incidentesParaReasignar.forEach(rel => {
        console.log(`- Incidente ${rel.incidenteId} → Caso ${rel.codeRef}`);
      });
    }
    
  } catch (error) {
    console.error('Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
verificarAsignacionDefectos().catch(error => {
  console.error('Error al ejecutar la verificación:', error);
});
