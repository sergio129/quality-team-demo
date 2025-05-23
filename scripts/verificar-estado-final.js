// Script para verificar el estado final de asignación de defectos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarEstadoFinal() {
  console.log('=== VERIFICACIÓN FINAL DE CASOS DE PRUEBA Y SUS DEFECTOS ===\n');
  
  try {
    // Obtener todos los casos de prueba con sus defectos
    const casosPrueba = await prisma.testCase.findMany({
      include: {
        defects: {
          include: {
            incident: true
          }
        }
      }
    });
    
    // 1. Resumen general
    console.log('RESUMEN GENERAL:');
    const totalCasos = casosPrueba.length;
    const casosConDefectos = casosPrueba.filter(caso => caso.defects && caso.defects.length > 0);
    const casosSinDefectos = casosPrueba.filter(caso => !caso.defects || caso.defects.length === 0);
    
    console.log(`- Total de casos de prueba: ${totalCasos}`);
    console.log(`- Casos con defectos: ${casosConDefectos.length}`);
    console.log(`- Casos sin defectos: ${casosSinDefectos.length}`);
    
    // 2. Distribución de estados
    console.log('\nDISTRIBUCIÓN DE ESTADOS:');
    const estadosUnicos = new Set();
    casosPrueba.forEach(caso => {
      estadosUnicos.add(caso.status || 'Null');
    });
    
    const estadosArray = Array.from(estadosUnicos);
    for (const estado of estadosArray) {
      const conteo = casosPrueba.filter(caso => 
        (caso.status === estado) || (!caso.status && estado === 'Null')
      ).length;
      console.log(`- Estado "${estado}": ${conteo} casos`);
    }
    
    // 3. Verificar consistencia de estados
    console.log('\nCONSISTENCIA DE ESTADOS:');
    
    const casosConEstadoInconsistente = casosPrueba.filter(caso => {
      // Casos que tienen defectos pero no están marcados como fallidos
      if (caso.defects.length > 0 && caso.status !== 'Fallido') {
        return true;
      }
      
      // Casos que no tienen defectos pero están marcados como fallidos
      if (caso.defects.length === 0 && caso.status === 'Fallido') {
        return true;
      }
      
      return false;
    });
    
    if (casosConEstadoInconsistente.length === 0) {
      console.log('✓ Todos los casos tienen estados consistentes con sus defectos.');
    } else {
      console.log(`⚠️ Se encontraron ${casosConEstadoInconsistente.length} casos con estado inconsistente:`);
      
      for (const caso of casosConEstadoInconsistente) {
        console.log(`  - Caso ${caso.codeRef}: ${caso.defects.length} defectos, estado "${caso.status || 'Null'}"`);
      }
    }
    
    // 4. Verificar asignación correcta de defectos
    console.log('\nASIGNACIÓN CORRECTA DE DEFECTOS:');
    
    const casosConDefectosIncorrectos = casosConDefectos.filter(caso => {
      // Solo verificar casos que tienen defectos con idJira de formato T###
      const defectosConIdJira = caso.defects.filter(d => 
        d.incident.idJira && d.incident.idJira.includes('-T')
      );
      
      if (defectosConIdJira.length === 0) {
        return false;
      }
      
      // Verificar si algún defecto no coincide con el caso actual
      return defectosConIdJira.some(defecto => {
        const idJira = defecto.incident.idJira;
        const coincide = 
          idJira === caso.codeRef || 
          idJira === `${caso.projectId}-${caso.codeRef}` ||
          caso.codeRef === idJira.replace(/^.*-/, '');
        
        return !coincide;
      });
    });
    
    if (casosConDefectosIncorrectos.length === 0) {
      console.log('✓ Todos los defectos están correctamente asignados a sus casos.');
    } else {
      console.log(`⚠️ Se encontraron ${casosConDefectosIncorrectos.length} casos con defectos posiblemente mal asignados:`);
      
      for (const caso of casosConDefectosIncorrectos) {
        console.log(`  - Caso ${caso.codeRef}:`);
        
        for (const defecto of caso.defects) {
          console.log(`    - Defecto ${defecto.incident.id} (${defecto.incident.idJira}): ${defecto.incident.descripcion.substring(0, 50)}...`);
          
          // Verificar si este defecto pertenece a este caso según su idJira
          if (defecto.incident.idJira && defecto.incident.idJira.includes('-T')) {
            const idJira = defecto.incident.idJira;
            const coincide = 
              idJira === caso.codeRef || 
              idJira === `${caso.projectId}-${caso.codeRef}` ||
              caso.codeRef === idJira.replace(/^.*-/, '');
            
            if (coincide) {
              console.log(`      ✓ Asignado correctamente`);
            } else {
              console.log(`      ⚠️ Posiblemente debería estar asignado a otro caso de prueba`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
verificarEstadoFinal().catch(error => {
  console.error('Error al ejecutar la verificación:', error);
});
