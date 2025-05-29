// Script para probar la API de vacaciones modificada para usar PostgreSQL
const http = require('http');

const API_PATH = '/api/analyst-vacations';
const HOST = 'localhost';
const PORT = 3000;

// Función para realizar solicitudes HTTP
async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (error) {
          reject(new Error(`Error al analizar la respuesta JSON: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Función principal de prueba
async function runTests() {
  try {
    console.log('Probando API de vacaciones con base de datos PostgreSQL...');
    
    // 1. Obtener todas las vacaciones
    console.log('\n1. Obteniendo todas las vacaciones...');
    const getAllResponse = await makeRequest(API_PATH);
    console.log(`Status: ${getAllResponse.statusCode}`);
    console.log(`Número de vacaciones: ${getAllResponse.data.length}`);
    
    if (getAllResponse.data.length > 0) {
      console.log('Primera vacación:');
      console.log(`- ID: ${getAllResponse.data[0].id}`);
      console.log(`- Analista ID: ${getAllResponse.data[0].analystId}`);
      console.log(`- Tipo: ${getAllResponse.data[0].type}`);
      console.log(`- Inicio: ${new Date(getAllResponse.data[0].startDate).toLocaleDateString()}`);
      console.log(`- Fin: ${new Date(getAllResponse.data[0].endDate).toLocaleDateString()}`);
    }
    
    // 2. Filtrar por ID de analista
    if (getAllResponse.data.length > 0) {
      const analystId = getAllResponse.data[0].analystId;
      console.log(`\n2. Obteniendo vacaciones para el analista ${analystId}...`);
      
      const getByAnalystResponse = await makeRequest(`${API_PATH}?analystId=${analystId}`);
      console.log(`Status: ${getByAnalystResponse.statusCode}`);
      console.log(`Número de vacaciones: ${getByAnalystResponse.data.length}`);
    }
    
    console.log('\nPruebas completadas con éxito');
    
  } catch (error) {
    console.error('Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
runTests();
