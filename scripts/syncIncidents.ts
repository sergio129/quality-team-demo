/**
 * Sincronizar incidentes
 * Archivos -> PostgreSQL
 */
async function syncIncidents(): Promise<void> {
  console.log('Sincronizando incidentes...');
  
  // Obtener datos de archivos
  const fileIncidents = await readJsonFile(INCIDENTS_FILE);
  
  // Obtener datos de PostgreSQL
  const dbIncidents = await prisma.incident.findMany({
    include: {
      informedBy: true,
      assignedTo: true,
      cell: true
    }
  });
  
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
        }
      }
      
      // Crear el incidente en PostgreSQL
      try {
        await prisma.incident.create({
          data: {
            id: fileIncident.id,
            titulo: fileIncident.titulo,
            descripcion: fileIncident.descripcion,
            estado: fileIncident.estado,
            severidad: fileIncident.severidad,
            prioridad: fileIncident.prioridad,
            fechaReporte: fileIncident.fechaReporte ? new Date(fileIncident.fechaReporte) : new Date(),
            fechaCreacion: fileIncident.fechaCreacion ? new Date(fileIncident.fechaCreacion) : new Date(),
            fechaSolucion: fileIncident.fechaSolucion ? new Date(fileIncident.fechaSolucion) : null,
            aplica: fileIncident.aplica ?? true,
            tiempoEstimado: fileIncident.tiempoEstimado ?? 0,
            tiempoReal: fileIncident.tiempoReal ?? 0,
            jiraId: fileIncident.jiraId || null,
            jiraStatus: fileIncident.jiraStatus || null,
            jiraLink: fileIncident.jiraLink || null,
            
            // Relaciones
            celId: cellId,
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
