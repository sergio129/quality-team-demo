// Script para probar la obtención de incidencias
// Usando importación dinámica para node-fetch
import('node-fetch').then(async ({ default: fetch }) => {
  await testGetIncidents(fetch);
});

async function testGetIncidents(fetch) {
  console.log("Enviando petición para obtener incidencias...");
  try {
    const response = await fetch('http://localhost:3000/api/incidents', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = responseText;
    }

    console.log("Status:", response.status);
    
    // Si hay datos, mostrar solo los campos relevantes de las primeras 3 incidencias
    if (Array.isArray(data) && data.length > 0) {
      console.log(`Se encontraron ${data.length} incidencias.`);
      console.log("Mostrando campos 'informadoPor' y 'asignadoA' de las primeras 3 incidencias:");
      
      data.slice(0, 3).forEach((incident, index) => {
        console.log(`Incidencia #${index + 1}:`);
        console.log("  ID:", incident.id);
        console.log("  Informado por:", incident.informadoPor || "NO DISPONIBLE");
        console.log("  Asignado a:", incident.asignadoA || "NO DISPONIBLE");
        console.log("  Célula:", incident.celula || "NO DISPONIBLE");
        console.log("  Cliente:", incident.cliente || "NO DISPONIBLE");
        console.log("  Estado:", incident.estado || "NO DISPONIBLE");
        console.log("----------------------------------------");
      });
    } else {
      console.log("No se encontraron incidencias o la respuesta no es un array.");
      console.log("Response:", data);
    }
    
  } catch (error) {
    console.error("Error al realizar la petición:", error);
  }
}

testGetIncidents();
