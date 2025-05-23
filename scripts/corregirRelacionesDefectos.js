// Script para corregir las relaciones entre incidentes y casos de prueba
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirRelacionesDefectos() {
  console.log('Iniciando corrección de relaciones entre incidentes y casos de prueba...');
  
  try {
    // Obtener todos los incidentes
    const incidentes = await prisma.incident.findMany();
    console.log(`Encontrados ${incidentes.length} incidentes.`);
    
    // Obtener todos los casos de prueba
    const casosPrueba = await prisma.testCase.findMany();
    console.log(`Encontrados ${casosPrueba.length} casos de prueba.`);
    
    // Imprimir todos los incidentes para analizar sus IDs
    console.log("\nIncidentes encontrados:");
    incidentes.forEach(inc => {
      console.log(`ID: ${inc.id}, idJira: ${inc.idJira}, estado: ${inc.estado}`);
    });
    
    // Imprimir algunos casos de prueba para referencia
    console.log("\nAlgunos casos de prueba (primeros 5):");
    casosPrueba.slice(0, 5).forEach(caso => {
      console.log(`ID: ${caso.id}, codeRef: ${caso.codeRef}, projectId: ${caso.projectId}`);
    });
    
    console.log("\nBuscando coincidencias...");
    
    let relacionesCreadas = 0;
    
    // Para cada incidente, buscar si su idJira corresponde a un código de caso de prueba
    for (const incidente of incidentes) {
      console.log(`\nAnalizando incidente: ${incidente.id} (idJira: ${incidente.idJira})`);
      
      // Buscar casos de prueba que coincidan con el idJira del incidente
      const casosCoincidentes = casosPrueba.filter(caso => {
        // Si alguno de los campos es nulo, no hay coincidencia
        if (!incidente.idJira || !caso.codeRef || !caso.projectId) {
          return false;
        }
        
        // Preparar las cadenas para comparación quitando guiones y espacios
        const idJiraNormalizado = incidente.idJira.replace(/-/g, '').toLowerCase();
        const codeRefNormalizado = caso.codeRef.replace(/-/g, '').toLowerCase();
        const projectIdNormalizado = caso.projectId.replace(/-/g, '').toLowerCase();
        
        // Verificar diferentes tipos de coincidencias
        const coincidenciaExacta = caso.codeRef === incidente.idJira;
        const coincidenciaCombinada = incidente.idJira === `${caso.projectId}-${caso.codeRef}`;
        const contieneCodeRef = incidente.idJira.includes(caso.codeRef);
        const contieneProjectId = incidente.idJira.includes(caso.projectId);
        const coincidenciaNormCodeRef = idJiraNormalizado.includes(codeRefNormalizado);
        const coincidenciaNormProjectId = idJiraNormalizado.includes(projectIdNormalizado);
        
        // Imprimir detalles de comparaciones para algunos casos
        if (caso.projectId === "KOIN-261" || caso.projectId === "SRCA-6556") {
          console.log(`  Comparando con caso: ${caso.codeRef} (${caso.projectId})`);
          console.log(`    - idJira: ${incidente.idJira} vs codeRef: ${caso.codeRef}`);
          console.log(`    - Coincidencia exacta: ${coincidenciaExacta}`);
          console.log(`    - Coincidencia combinada: ${coincidenciaCombinada}`);
          console.log(`    - Contiene codeRef: ${contieneCodeRef}`);
          console.log(`    - Contiene projectId: ${contieneProjectId}`);
          console.log(`    - Coincidencia normalizada codeRef: ${coincidenciaNormCodeRef}`);
          console.log(`    - Coincidencia normalizada projectId: ${coincidenciaNormProjectId}`);
        }
        
        // Si hay coincidencia directa con el idJira específico basado en el formato del proyecto
        if (incidente.idJira.startsWith('KOIN-261-T') && caso.projectId === 'KOIN-261') {
          // Extraer el número del caso de prueba del idJira (ej. KOIN-261-T003 → 003)
          const match = incidente.idJira.match(/T(\d+)$/);
          if (match) {
            const numeroIncidente = match[1];
            const numeroCaso = caso.codeRef.match(/T(\d+)$/)?.[1];
            if (numeroIncidente === numeroCaso) {
              console.log(`  ¡Coincidencia especial por número de caso! ${numeroIncidente} === ${numeroCaso}`);
              return true;
            }
          }
        }
        
        return coincidenciaExacta || 
               coincidenciaCombinada || 
               contieneCodeRef || 
               contieneProjectId || 
               coincidenciaNormCodeRef || 
               coincidenciaNormProjectId;
      });
      
      if (casosCoincidentes.length > 0) {
        console.log(`Incidente ${incidente.id} (${incidente.idJira}) coincide con ${casosCoincidentes.length} caso(s) de prueba.`);
        
        // Para cada caso de prueba coincidente, crear la relación con el incidente
        for (const caso of casosCoincidentes) {
          try {
            // Verificar si ya existe la relación
            const relacionExistente = await prisma.defectRelation.findFirst({
              where: {
                testCaseId: caso.id,
                incidentId: incidente.id
              }
            });
            
            if (!relacionExistente) {
              // Crear la relación entre el incidente y el caso de prueba
              await prisma.defectRelation.create({
                data: {
                  testCaseId: caso.id,
                  incidentId: incidente.id
                }
              });
              
              // Actualizar el estado del caso de prueba a "Fallido" si está en "No ejecutado" o null
              if (!caso.status || caso.status === 'No ejecutado') {
                await prisma.testCase.update({
                  where: { id: caso.id },
                  data: {
                    status: 'Fallido',
                    updatedAt: new Date()
                  }
                });
                console.log(`  - Caso de prueba ${caso.codeRef} actualizado a estado "Fallido"`);
              }
              
              relacionesCreadas++;
              console.log(`  - Relación creada con caso de prueba ${caso.codeRef}`);
            } else {
              console.log(`  - Ya existe una relación con caso de prueba ${caso.codeRef}`);
            }
          } catch (error) {
            console.error(`  - Error al crear relación con caso de prueba ${caso.codeRef}:`, error);
          }
        }
      }
    }
    
    console.log(`\nProceso completado. Se crearon ${relacionesCreadas} relaciones entre incidentes y casos de prueba.`);
    
    // Refrescar las relaciones para validar el resultado
    const defectRelations = await prisma.defectRelation.count();
    console.log(`Total de relaciones en la base de datos: ${defectRelations}`);
    
    // Contar casos de prueba con defectos
    const casosConDefectos = await prisma.testCase.count({
      where: {
        defects: {
          some: {}
        }
      }
    });
    console.log(`Total de casos de prueba con defectos asociados: ${casosConDefectos}`);
    
  } catch (error) {
    console.error('Error al corregir relaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirRelacionesDefectos();