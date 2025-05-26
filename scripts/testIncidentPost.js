// Script para probar la creación de incidencias con datos específicos
// Usando importación dinámica para node-fetch
import('node-fetch').then(async ({ default: fetch }) => {
  await testIncidentPost(fetch);
});

async function testIncidentPost(fetch) {
  // Datos exactos del ejemplo que está fallando
  const incidentData = {
    celula: "Suramericana",
    estado: "Abierto",
    prioridad: "Media",
    descripcion: "Se hace validacion del de la historia de usuario 2, Colas Genesys Cloud debe ser obligatorio, pero esta condicion no se esta cumpliendo",
    fechaReporte: new Date("2025-05-23"),
    informadoPor: "Sergio Anaya",
    asignadoA: "Cristian Herrera",
    cliente: "Suramericana Atencion y Mantenimiento de Clientes Servicio al cliente Asistencia",
    idJira: "SRCA-6565",
    fechaCreacion: new Date("2025-05-26T19:36:14.509Z"),
    tipoBug: "Funcional",
    areaAfectada: "Frontend",
    etiquetas: [],
    esErroneo: false,
    aplica: false
  };

  console.log("Enviando petición para crear incidencia...");
  try {
    const response = await fetch('http://localhost:3000/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incidentData),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = responseText;
    }

    console.log("Status:", response.status);
    console.log("Response:", data);

    if (response.status === 200) {
      console.log("✅ Éxito: La incidencia se ha creado correctamente");
    } else {
      console.log("❌ Error: No se pudo crear la incidencia");
    }
  } catch (error) {
    console.error("Error al realizar la petición:", error);
  }
}

testIncidentPost();
