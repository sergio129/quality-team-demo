// Script para probar la creación de incidencias
const fetch = require('node-fetch');

async function testCreateIncident() {
  const incidentData = {
    celula: "Frontend", // Nombre de la célula
    estado: "Abierto",
    prioridad: "Media",
    descripcion: "Incidencia de prueba para verificar la corrección del error 500",
    fechaCreacion: new Date(),
    fechaReporte: new Date(),
    informadoPor: "Juan Pérez", // Nombre del analista
    asignadoA: "Ana Gómez", // Nombre del analista
    esErroneo: false,
    aplica: true,
    cliente: "Cliente de Prueba",
    idJira: "TEST-123",
    etiquetas: ["prueba", "test"]
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

    const data = await response.json();
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

testCreateIncident();
