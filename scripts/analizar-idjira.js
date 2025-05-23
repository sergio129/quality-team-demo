// analizar-idjira.js
const fs = require('fs');
const path = require('path');

// Leer los archivos de datos
const incidentsPath = path.join(__dirname, '../data/incidents.txt');
const testCasesPath = path.join(__dirname, '../data/test-cases.txt');

// Cargar los datos
const incidents = JSON.parse(fs.readFileSync(incidentsPath, 'utf8'));
const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

console.log('========= ANÁLISIS DE RELACIONES ENTRE INCIDENTES Y CASOS DE PRUEBA =========\n');

// Mostrar ejemplos de idJira en incidentes
console.log('EJEMPLOS DE IDJIRA EN INCIDENTES:');
incidents.slice(0, 8).forEach(inc => {
  console.log(`ID: ${inc.id}, idJira: ${inc.idJira}`);
});

console.log('\n========= BÚSQUEDA DE POSIBLES COINCIDENCIAS =========\n');

// Buscar coincidencias entre idJira y projectId/codeRef de casos de prueba
incidents.forEach(incident => {
  const matchingTestCases = testCases.filter(tc => {
    // Verificar si el idJira del incidente coincide con el projectId o el codeRef del caso de prueba
    return tc.projectId === incident.idJira || 
           tc.codeRef === incident.idJira ||
           incident.idJira.includes(tc.projectId) ||
           incident.idJira === tc.codeRef;
  });
  
  if (matchingTestCases.length > 0) {
    console.log(`Incidente ${incident.id} (idJira: ${incident.idJira}) coincide con ${matchingTestCases.length} caso(s) de prueba:`);
    matchingTestCases.forEach(tc => {
      console.log(`  - ${tc.id} (${tc.codeRef}): ${tc.name}`);
    });
    console.log();
  }
});

// Analizar los casos de prueba con defectos
console.log('\n========= CASOS DE PRUEBA CON DEFECTOS =========\n');
const casesWithDefects = testCases.filter(tc => tc.defects && tc.defects.length > 0);
console.log(`Encontrados ${casesWithDefects.length} casos de prueba con defectos asociados.`);

if (casesWithDefects.length > 0) {
  casesWithDefects.forEach(tc => {
    console.log(`Caso de prueba: ${tc.codeRef} (${tc.id})`);
    console.log(`  Estado: ${tc.status || 'null'}`);
    console.log(`  Defectos: ${tc.defects.length}`);
    
    // Buscar los incidentes asociados
    const linkedIncidents = incidents.filter(inc => tc.defects.includes(inc.id));
    linkedIncidents.forEach(inc => {
      console.log(`    - ${inc.id} (${inc.idJira}): ${inc.descripcion.substring(0, 50)}...`);
    });
    console.log();
  });
}
