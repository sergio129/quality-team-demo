const { PrismaClient } = require('@prisma/client');

async function checkProjects() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Checking projects in database...');
        
        // Contar todos los proyectos
        const totalCount = await prisma.project.count();
        console.log(`Total projects in database: ${totalCount}`);
        
        // Obtener los primeros 5 proyectos
        const projects = await prisma.project.findMany({
            take: 5,
            include: {
                team: true,
                cell: true,
                analysts: {
                    include: {
                        analyst: true
                    }
                }
            }
        });
        
        console.log('\nFirst 5 projects:');
        projects.forEach((project, index) => {
            console.log(`${index + 1}. ${project.idJira} - ${project.proyecto} (${project.team?.name}/${project.cell?.name})`);
        });
        
        // Probar la paginación
        console.log('\n--- Testing pagination ---');
        const paginatedResult = await prisma.project.findMany({
            take: 5,
            skip: 0,
            orderBy: {
                fechaEntrega: 'asc'
            }
        });
        
        console.log(`Paginated result (limit=5, page=1): ${paginatedResult.length} projects`);
        paginatedResult.forEach((project, index) => {
            console.log(`  ${index + 1}. ${project.idJira} - ${project.proyecto}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProjects();
