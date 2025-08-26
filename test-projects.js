const { PrismaClient } = require('@prisma/client');

async function testProjectsData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== TESTING PROJECTS DATA ===');
    
    // 1. Verificar equipos
    const teams = await prisma.team.findMany();
    console.log('\n1. Equipos encontrados:', teams.length);
    teams.forEach(team => {
      console.log(`  - ${team.name} (ID: ${team.id})`);
    });
    
    // 2. Verificar proyectos con sus relaciones
    const projects = await prisma.project.findMany({
      include: {
        team: true,
        cell: true
      }
    });
    
    console.log('\n2. Proyectos encontrados:', projects.length);
    projects.forEach(project => {
      console.log(`  - ${project.idJira}: ${project.proyecto}`);
      console.log(`    Equipo: ${project.team?.name || 'N/A'} (equipoId: ${project.equipoId})`);
      console.log(`    Estado: ${project.estado} | EstadoCalculado: ${project.estadoCalculado}`);
      console.log('    ---');
    });
    
    // 3. Contar proyectos activos por equipo
    console.log('\n3. Proyectos activos por equipo:');
    for (const team of teams) {
      const activeProjects = projects.filter(p => 
        p.team?.name === team.name && 
        (
          p.estadoCalculado === 'En Progreso' || 
          p.estadoCalculado === 'Por Iniciar' || 
          p.estado === 'en progreso' || 
          p.estado?.toLowerCase().includes('iniciar')
        )
      );
      console.log(`  - ${team.name}: ${activeProjects.length} proyectos activos`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsData();
