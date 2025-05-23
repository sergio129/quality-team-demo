// Script para analizar las relaciones entre incidentes y casos de prueba
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarRelacionesDefectos() {
  console.log('=== ANÁLISIS DE RELACIONES ENTRE INCIDENTES Y CASOS DE PRUEBA ===\n');
  
  try {
    // 1. Obtener todos los casos de prueba con sus defectos relacionados
    const casosPrueba = await prisma.testCase.findMany({
      include: {
        defects: {
          include: {
            incident: true
          }
        }
      }
    });
    
    console.log(`Encontrados ${casosPrueba.length} casos de prueba en total.\n`);
    
    // 2. Filtrar los casos de prueba que tienen defectos asociados
    const casosConDefectos = casosPrueba.filter(caso => caso.defects && caso.defects.length > 0);
    console.log(`Encontrados ${casosConDefectos.length} casos de prueba con defectos asociados.\n`);
    
    // 3. Contar casos por número de defectos
    const casosConUnDefecto = casosConDefectos.filter(caso => caso.defects.length === 1);
    const casosConDosDefectos = casosConDefectos.filter(caso => caso.defects.length === 2);
    const casosConTresDefectos = casosConDefectos.filter(caso => caso.defects.length === 3);
    const casosConMasDefectos = casosConDefectos.filter(caso => caso.defects.length > 3);
    
    console.log(`Distribución de casos por número de defectos:`);
    console.log(`- Casos con 1 defecto: ${casosConUnDefecto.length}`);
    console.log(`- Casos con 2 defectos: ${casosConDosDefectos.length}`);
    console.log(`- Casos con 3 defectos: ${casosConTresDefectos.length}`);
    console.log(`- Casos con más de 3 defectos: ${casosConMasDefectos.length}\n`);
    
    // 4. Analizar casos con múltiples defectos para detectar posibles duplicados
    console.log('=== ANÁLISIS DE CASOS CON MÚLTIPLES DEFECTOS ===\n');
    
    let casosConDefectosDuplicados = 0;
    let casosConDefectosRelacionados = 0;
    
    // Analizamos solo los casos con 2 o más defectos
    const casosMultipleDefectos = [...casosConDosDefectos, ...casosConTresDefectos, ...casosConMasDefectos];
    
    for (const caso of casosMultipleDefectos) {
      console.log(`\nAnalizando caso: ${caso.codeRef} - ${caso.name.substring(0, 50)}${caso.name.length > 50 ? '...' : ''}`);
      console.log(`  ID: ${caso.id}`);
      console.log(`  Estado: ${caso.status || 'No definido'}`);
      console.log(`  Número de defectos: ${caso.defects.length}`);
      
      // Extraer los defectos para análisis
      const defectos = caso.defects.map(d => d.incident);
      console.log(`  Defectos asociados:`);
      
      // Comprobar similitudes entre los defectos
      let posiblesDuplicados = false;
      let defectosRelacionados = false;
      
      // Imprimir información de cada defecto
      defectos.forEach((defecto, i) => {
        console.log(`    [${i+1}] ID: ${defecto.id}, idJira: ${defecto.idJira}, Estado: ${defecto.estado}`);
        console.log(`        Descripción: ${defecto.descripcion.substring(0, 100)}${defecto.descripcion.length > 100 ? '...' : ''}`);
      });
      
      // Comparar las descripciones de los defectos para detectar posibles duplicados
      for (let i = 0; i < defectos.length; i++) {
        for (let j = i + 1; j < defectos.length; j++) {
          const similitud = calcularSimilitudTexto(defectos[i].descripcion, defectos[j].descripcion);
          
          if (similitud > 0.6) {
            console.log(`    ⚠️ POSIBLE DUPLICADO: Defecto ${defectos[i].id} y ${defectos[j].id} tienen ${Math.round(similitud * 100)}% de similitud.`);
            posiblesDuplicados = true;
          }
          
          // Verificar si los defectos tienen el mismo idJira
          if (defectos[i].idJira === defectos[j].idJira && defectos[i].idJira) {
            console.log(`    ⚠️ MISMO ID JIRA: Defecto ${defectos[i].id} y ${defectos[j].id} tienen el mismo idJira: ${defectos[i].idJira}`);
            defectosRelacionados = true;
          }
        }
      }
      
      // Verificar inconsistencias de estado
      if (caso.status === null || caso.status === 'No ejecutado') {
        console.log(`    ⚠️ INCONSISTENCIA DE ESTADO: El caso tiene defectos pero su estado es '${caso.status || 'No definido'}'`);
      }
      
      if (posiblesDuplicados) {
        casosConDefectosDuplicados++;
      }
      
      if (defectosRelacionados) {
        casosConDefectosRelacionados++;
      }
    }
    
    console.log('\n=== RESUMEN DEL ANÁLISIS ===');
    console.log(`Total de casos con posibles defectos duplicados: ${casosConDefectosDuplicados}`);
    console.log(`Total de casos con defectos relacionados (mismo idJira): ${casosConDefectosRelacionados}`);
    
    // 5. Verificar que todos los casos con defectos tengan el estado correcto
    console.log('\n=== VERIFICACIÓN DE ESTADOS DE CASOS CON DEFECTOS ===');
    
    const casosConEstadoIncorrecto = casosConDefectos.filter(caso => 
      !caso.status || caso.status === 'No ejecutado' || caso.status === 'Exitoso'
    );
    
    console.log(`Encontrados ${casosConEstadoIncorrecto.length} casos con estados incorrectos:`);
    casosConEstadoIncorrecto.forEach(caso => {
      console.log(`- ${caso.codeRef}: Estado '${caso.status || 'No definido'}' con ${caso.defects.length} defecto(s)`);
    });
    
  } catch (error) {
    console.error('Error durante el análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para calcular la similitud entre dos textos
function calcularSimilitudTexto(texto1, texto2) {
  if (!texto1 || !texto2) return 0;
  
  // Normalizar textos: convertir a minúsculas y eliminar caracteres especiales
  const normalizar = (texto) => texto.toLowerCase().replace(/[^\w\s]/g, '');
  
  const textoNorm1 = normalizar(texto1);
  const textoNorm2 = normalizar(texto2);
  
  // Dividir en palabras
  const palabras1 = new Set(textoNorm1.split(/\s+/));
  const palabras2 = new Set(textoNorm2.split(/\s+/));
  
  // Calcular intersección de palabras
  const interseccion = [...palabras1].filter(palabra => palabras2.has(palabra));
  
  // Calcular coeficiente de Jaccard (similitud)
  const union = new Set([...palabras1, ...palabras2]);
  return interseccion.length / union.size;
}

// Ejecutar el análisis
analizarRelacionesDefectos().catch(error => {
  console.error('Error al ejecutar el análisis:', error);
});
