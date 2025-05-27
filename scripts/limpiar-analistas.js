// Script para ejecutar la limpieza de analistas a través del API
// Compatible con Node.js para evitar problemas con PowerShell

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración
const baseUrl = 'http://localhost:3000/api/analysts/cleanup';
const outputFile = path.join(__dirname, '..', 'limpieza-analistas-resultado.json');

console.log('🧹 Iniciando limpieza de analistas problemáticos...');
console.log('📡 Conectando con el API en:', baseUrl);

// Realizar la solicitud GET al endpoint de limpieza
http.get(baseUrl, (res) => {
  const statusCode = res.statusCode;
  const contentType = res.headers['content-type'];

  let error;
  if (statusCode !== 200) {
    error = new Error(`Error en la solicitud. Código de estado: ${statusCode}`);
  } else if (!/^application\/json/.test(contentType)) {
    error = new Error(`Tipo de contenido inválido: ${contentType}. Se esperaba application/json`);
  }

  if (error) {
    console.error('❌ ' + error.message);
    // Consumir la respuesta para liberar memoria
    res.resume();
    return;
  }

  // Acumular los datos de la respuesta
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  
  // Procesar los datos al finalizar la transmisión
  res.on('end', () => {
    try {
      const result = JSON.parse(rawData);
      
      // Guardar los resultados en un archivo
      fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
      
      // Mostrar un resumen en la consola
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`📊 Analistas procesados: ${result.processed}`);
        console.log(`✅ Exitosos: ${result.successful}`);
        console.log(`❌ Fallidos: ${result.failed}`);
        if (result.results && result.results.length > 0) {
          console.log('\n📝 Detalles de la operación:');
          result.results.forEach(item => {
            const icon = item.success ? '✅' : '❌';
            console.log(`${icon} ${item.name} (${item.email}): ${item.message}`);
          });
        }
      } else {
        console.log(`❌ Error: ${result.error}`);
        console.log(`📝 Detalles: ${result.details || 'No hay detalles adicionales'}`);
      }
      
      console.log(`\n📄 Los resultados completos se han guardado en: ${outputFile}`);
      console.log(`\n🌐 Para repetir este proceso, simplemente abre en el navegador: ${baseUrl}`);
    } catch (e) {
      console.error('❌ Error al procesar la respuesta:', e.message);
    }
  });
}).on('error', (e) => {
  console.error(`❌ Error de conexión: ${e.message}`);
});
