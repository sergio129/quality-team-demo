/**
 * Sincronizar incidentes
 * Archivos -> PostgreSQL
 */
async function syncIncidents(): Promise<void> {
  console.log('Sincronizando incidentes...');
  
  // Obtener datos de archivos
  const fileIncidents = await readJsonFile(INCIDENTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbIncidents = await prisma.incident.findMany();
  
  // Mapear IDs para comparación rápida
  const dbIncidentIds = new Set(dbIncidents.map(i => i.id));
  
  // Migrar incidentes que solo existen en archivos a PostgreSQL
  let newIncidentsCount = 0;
  for (const fileIncident of fileIncidents) {
    if (!dbIncidentIds.has(fileIncident.id)) {
      // Buscar IDs de analistas por nombre
      let informedById = null;
      let assignedToId = null;
      
      if (fileIncident.informadoPor) {
        const informer = await prisma.qAAnalyst.findFirst({
          where: {
            name: {
              contains: fileIncident.informadoPor.trim()
            }
          }
        });
        if (informer) {
          informedById = informer.id;
        } else {
          // Si no se encuentra el analista, usar el primero disponible
          const firstAnalyst = await prisma.qAAnalyst.findFirst();
          if (firstAnalyst) {
            informedById = firstAnalyst.id;
            console.log(`⚠️ No se encontró el analista ${fileIncident.informadoPor}, usando ${firstAnalyst.name} como remplazo`);
          }
        }
      }
      
      if (fileIncident.asignadoA) {
        const assignee = await prisma.qAAnalyst.findFirst({
          where: {
            name: {
              contains: fileIncident.asignadoA.trim()
            }
          }
        });
        if (assignee) {
          assignedToId = assignee.id;
        } else {
          // Si no se encuentra el analista, usar el mismo que informó
          assignedToId = informedById;
          console.log(`⚠️ No se encontró el analista ${fileIncident.asignadoA}, usando el informante como remplazo`);
        }
      }
      
      // Buscar ID de célula por nombre
      let cellId = null;
      if (fileIncident.celula) {
        const cell = await prisma.cell.findFirst({
          where: {
            name: {
              contains: fileIncident.celula.trim()
            }
          }
        });
        if (cell) {
          cellId = cell.id;
        } else {
          // Si no se encuentra la célula, usar la primera disponible
          const firstCell = await prisma.cell.findFirst();
          if (firstCell) {
            cellId = firstCell.id;
            console.log(`⚠️ No se encontró la célula ${fileIncident.celula}, usando ${firstCell.name} como remplazo`);
          }
        }
      }
      
      if (!cellId || !informedById || !assignedToId) {
        console.error(`❌ No se puede migrar el incidente ${fileIncident.id} por falta de referencias obligatorias`);
        continue;
      }
      
      // Crear el incidente en PostgreSQL
      try {
        await prisma.incident.create({
          data: {
            id: fileIncident.id,
            estado: fileIncident.estado || "Nuevo",
            prioridad: fileIncident.prioridad || "Media",
            descripcion: fileIncident.descripcion || "",
            cliente: fileIncident.cliente || "No especificado",
            idJira: fileIncident.jiraId || "",
            fechaReporte: fileIncident.fechaReporte ? new Date(fileIncident.fechaReporte) : new Date(),
            fechaCreacion: fileIncident.fechaCreacion ? new Date(fileIncident.fechaCreacion) : new Date(),
            fechaSolucion: fileIncident.fechaSolucion ? new Date(fileIncident.fechaSolucion) : null,
            diasAbierto: fileIncident.diasAbierto || 0,
            esErroneo: fileIncident.esErroneo || false,
            aplica: fileIncident.aplica ?? true,
            tipoBug: fileIncident.tipoBug || null,
            areaAfectada: fileIncident.areaAfectada || null,
            
            // Relaciones
            celula: cellId,
            informadoPorId: informedById,
            asignadoAId: assignedToId
          }
        });
        
        newIncidentsCount++;
      } catch (error) {
        console.error(`Error al migrar el incidente ${fileIncident.id}:`, error);
      }
    }
  }
  
  console.log(`✅ ${newIncidentsCount} nuevos incidentes migrados a PostgreSQL`);
}
