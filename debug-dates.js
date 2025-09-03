const { PrismaClient } = require('@prisma/client');

async function checkProjectDates() {
  const prisma = new PrismaClient();
  
  try {
    // Obtener algunos proyectos para ver qué fechas tienen
    const projects = await prisma.project.findMany({
      select: {
        idJira: true,
        proyecto: true,
        fechaEntrega: true,
        fechaCertificacion: true,
        fechaInicio: true,
        fechaFin: true
      },
      take: 20
    });
    
    console.log('\n=== FECHAS DE PROYECTOS ===');
    console.log(`Total proyectos revisados: ${projects.length}`);
    
    projects.forEach(p => {
      console.log(`\n${p.idJira} - ${p.proyecto}`);
      console.log(`  Fecha Inicio: ${p.fechaInicio || 'N/A'}`);
      console.log(`  Fecha Entrega: ${p.fechaEntrega || 'N/A'}`);
      console.log(`  Fecha Fin: ${p.fechaFin || 'N/A'}`);
      console.log(`  Fecha Certificación: ${p.fechaCertificacion || 'N/A'}`);
    });
    
    // Verificar cuántos proyectos hay en septiembre 2025
    const sept2025Start = new Date(2025, 8, 1); // mes 8 = septiembre (0-based)
    const sept2025End = new Date(2025, 8, 30, 23, 59, 59);
    
    const projectsInSept2025 = await prisma.project.count({
      where: {
        OR: [
          {
            fechaEntrega: {
              gte: sept2025Start,
              lte: sept2025End
            }
          },
          {
            fechaCertificacion: {
              gte: sept2025Start,
              lte: sept2025End
            }
          }
        ]
      }
    });
    
    console.log(`\n=== FILTRO SEPTIEMBRE 2025 ===`);
    console.log(`Proyectos en septiembre 2025: ${projectsInSept2025}`);
    console.log(`Rango: ${sept2025Start} - ${sept2025End}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectDates();
