// Script para corregir la asignación incorrecta de defectos a casos de prueba
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirAsignacionDefectos() {
  console.log('=== CORRECCIÓN DE ASIGNACIÓN DE DEFECTOS A CASOS DE PRUEBA ===\n');
  
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
    
    console.log(`Encontrados ${incidentes.length} incidentes en total.`);
    
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
            incident: {
              select: {
                id: true,
                idJira: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Encontrados ${casosPrueba.length} casos de prueba en total.\n`);
    
    // 3. Recopilar todas las relaciones que necesitan ser eliminadas
    console.log('Identificando relaciones incorrectas para eliminar...');
    
    let relacionesAEliminar = [];
    let relacionesACrear = [];
    let casosActualizados = new Set();
    
    // Para cada caso de prueba, verificar si tiene defectos que deberían estar asignados a otro caso
    for (const caso of casosPrueba) {
      if (!caso.defects || caso.defects.length === 0) continue;
      
      for (const defect of caso.defects) {
        // Si el defecto tiene un idJira que indica que pertenece a otro caso
        if (defect.incident.idJira && defect.incident.idJira.includes('-T')) {
          // Buscar el caso correcto según el idJira
          const casoCorrespondiente = casosPrueba.find(c => 
            c.codeRef === defect.incident.idJira ||
            `${c.projectId}-${c.codeRef}` === defect.incident.idJira ||
            c.codeRef === defect.incident.idJira.replace(/^.*-/, '')
          );
          
          // Si el caso encontrado es diferente al actual, registrar para eliminar y recrear
          if (casoCorrespondiente && casoCorrespondiente.id !== caso.id) {
            console.log(`- Defecto ${defect.incident.id} (${defect.incident.idJira}) debe moverse de ${caso.codeRef} a ${casoCorrespondiente.codeRef}`);
            
            // Añadir relación a eliminar
            relacionesAEliminar.push({
              incidentId: defect.incident.id,
              testCaseId: caso.id
            });
            
            // Añadir relación a crear si no existe ya
            const existeRelacion = casoCorrespondiente.defects.some(d => 
              d.incident.id === defect.incident.id
            );
            
            if (!existeRelacion) {
              relacionesACrear.push({
                incidentId: defect.incident.id,
                testCaseId: casoCorrespondiente.id
              });
            }
            
            // Marcar ambos casos para actualización de estado
            casosActualizados.add(caso.id);
            casosActualizados.add(casoCorrespondiente.id);
          }
        }
      }
    }
    
    console.log(`\nSe identificaron ${relacionesAEliminar.length} relaciones incorrectas para eliminar.`);
    console.log(`Se identificaron ${relacionesACrear.length} relaciones para crear.`);
    console.log(`Se actualizarán ${casosActualizados.size} casos de prueba.\n`);
    
    // 4. Eliminar las relaciones incorrectas
    if (relacionesAEliminar.length > 0) {
      console.log('Eliminando relaciones incorrectas...');
      
      for (const relacion of relacionesAEliminar) {
        await prisma.defectRelation.deleteMany({
          where: {
            incidentId: relacion.incidentId,
            testCaseId: relacion.testCaseId
          }
        });
      }
      
      console.log(`✓ ${relacionesAEliminar.length} relaciones eliminadas correctamente.`);
    }
    
    // 5. Crear las nuevas relaciones correctas
    if (relacionesACrear.length > 0) {
      console.log('Creando nuevas relaciones correctas...');
      
      for (const relacion of relacionesACrear) {
        try {
          await prisma.defectRelation.create({
            data: {
              incidentId: relacion.incidentId,
              testCaseId: relacion.testCaseId
            }
          });
        } catch (error) {
          // Ignorar errores de duplicados (unique constraint)
          if (!error.message.includes('Unique constraint')) {
            throw error;
          }
        }
      }
      
      console.log(`✓ Relaciones creadas correctamente.`);
    }
    
    // 6. Actualizar estados de casos afectados
    if (casosActualizados.size > 0) {
      console.log('Actualizando estados de casos de prueba...');
      
      for (const casoId of casosActualizados) {
        // Obtener el caso actualizado con sus defectos
        const casoActualizado = await prisma.testCase.findUnique({
          where: { id: casoId },
          include: {
            defects: true
          }
        });
        
        // Si el caso tiene defectos, asegurar que esté marcado como "Fallido"
        if (casoActualizado.defects.length > 0) {
          await prisma.testCase.update({
            where: { id: casoId },
            data: {
              status: 'Fallido',
              updatedAt: new Date()
            }
          });
        }
        // Si el caso ya no tiene defectos, marcarlo como "No ejecutado"
        else if (!casoActualizado.status || casoActualizado.status === 'Fallido') {
          await prisma.testCase.update({
            where: { id: casoId },
            data: {
              status: 'No ejecutado',
              updatedAt: new Date()
            }
          });
        }
      }
      
      console.log(`✓ Estados de casos actualizados correctamente.`);
    }
    
    // 7. Verificación final
    console.log('\nVerificando resultado final...');
    
    // Contar relaciones por caso de prueba
    const casosConDefectos = await prisma.testCase.findMany({
      where: {
        defects: {
          some: {}
        }
      },
      include: {
        defects: {
          include: {
            incident: true
          }
        }
      }
    });
    
    console.log(`\nDespués de la corrección hay ${casosConDefectos.length} casos de prueba con defectos.`);
    
    // Mostrar casos con sus defectos correctamente asignados
    console.log('\nDefectos asignados correctamente:');
    for (const caso of casosConDefectos) {
      console.log(`- Caso ${caso.codeRef}: ${caso.defects.length} defectos, estado: ${caso.status}`);
      
      // Verificar que los defectos asignados coincidan con el codeRef
      const defectosCorrectos = caso.defects.filter(defect => {
        if (!defect.incident.idJira || !defect.incident.idJira.includes('-T')) return true;
        
        return defect.incident.idJira === caso.codeRef ||
               defect.incident.idJira === `${caso.projectId}-${caso.codeRef}` ||
               caso.codeRef === defect.incident.idJira.replace(/^.*-/, '');
      });
      
      // Mostrar coincidencias
      if (defectosCorrectos.length === caso.defects.length) {
        console.log(`  ✓ Todos los defectos están correctamente asignados.`);
      } else {
        console.log(`  ⚠️ ${caso.defects.length - defectosCorrectos.length} defectos pueden estar mal asignados.`);
      }
    }
    
    console.log('\n=== PROCESO COMPLETADO ===');
    
  } catch (error) {
    console.error('Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirAsignacionDefectos().catch(error => {
  console.error('Error al ejecutar la corrección:', error);
});
