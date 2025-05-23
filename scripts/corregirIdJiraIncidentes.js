// Script para corregir los valores de idJira en la tabla de incidentes
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function corregirIdJiraIncidentes() {
  console.log('Iniciando corrección de valores idJira en incidentes...');
  
  try {
    // Leer los datos del archivo incidents.txt
    const incidentsPath = path.join(__dirname, '../data/incidents.txt');
    const incidentesArchivo = JSON.parse(fs.readFileSync(incidentsPath, 'utf8'));
    
    console.log(`Leídos ${incidentesArchivo.length} incidentes del archivo.`);
    
    // Obtener incidentes de la base de datos
    const incidentesBD = await prisma.incident.findMany();
    console.log(`Encontrados ${incidentesBD.length} incidentes en la base de datos.`);
    
    let actualizados = 0;
    
    // Para cada incidente en la base de datos, buscar su correspondiente en el archivo
    for (const incidenteBD of incidentesBD) {
      const incidenteArchivo = incidentesArchivo.find(inc => inc.id === incidenteBD.id);
      
      if (incidenteArchivo && incidenteArchivo.idJira) {
        console.log(`Actualizando incidente ${incidenteBD.id} con idJira: ${incidenteArchivo.idJira}`);
        
        // Actualizar el valor de idJira en la base de datos
        await prisma.incident.update({
          where: { id: incidenteBD.id },
          data: { idJira: incidenteArchivo.idJira }
        });
        
        actualizados++;
      } else {
        console.log(`No se encontró datos correspondientes para el incidente ${incidenteBD.id}`);
      }
    }
    
    console.log(`\nProceso completado. Se actualizaron ${actualizados} registros de incidentes.`);
    
  } catch (error) {
    console.error('Error al corregir valores idJira:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirIdJiraIncidentes();
