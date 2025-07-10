// Script para verificar las asignaciones entre proyectos y analistas
// Busca inconsistencias y muestra información detallada sobre las relaciones

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarProyectosAnalistas() {
    console.log('Verificando relaciones entre proyectos y analistas...');
    
    try {
        // 1. Obtener todos los analistas
        const analistas = await prisma.qAAnalyst.findMany({
            include: {
                projects: {
                    include: {
                        project: true
                    }
                },
                user: true
            }
        });
        
        console.log(`\n=== ANALISTAS (${analistas.length}) ===`);
        
        // Información sobre analistas y sus proyectos
        for (const analista of analistas) {
            console.log(`\n- ${analista.name} (${analista.email})`);
            console.log(`  ID: ${analista.id}`);
            console.log(`  Rol: ${analista.role}`);
            console.log(`  Usuario: ${analista.user ? analista.user.email : 'No tiene'}`);
            console.log(`  Proyectos asignados: ${analista.projects.length}`);
            
            // Detallar proyectos si tiene alguno
            if (analista.projects.length > 0) {
                console.log('  Lista de proyectos:');
                analista.projects.forEach((pa, index) => {
                    console.log(`    ${index + 1}. ${pa.project.proyecto} (${pa.project.idJira})`);
                });
            } else {
                console.log('  ⚠️ ESTE ANALISTA NO TIENE PROYECTOS ASIGNADOS');
            }
        }
        
        // 2. Obtener todos los proyectos con sus analistas
        const proyectos = await prisma.project.findMany({
            include: {
                analysts: {
                    include: {
                        analyst: true
                    }
                },
                team: true,
                cell: true
            }
        });
        
        console.log(`\n=== PROYECTOS (${proyectos.length}) ===`);
        console.log(`Proyectos con analistas: ${proyectos.filter(p => p.analysts.length > 0).length}`);
        console.log(`Proyectos sin analistas: ${proyectos.filter(p => p.analysts.length === 0).length}`);
        
        // Detallar proyectos sin analistas
        console.log('\n=== PROYECTOS SIN ANALISTAS ===');
        proyectos
            .filter(p => p.analysts.length === 0)
            .forEach((proyecto, index) => {
                console.log(`${index + 1}. ${proyecto.proyecto} (${proyecto.idJira})`);
                console.log(`   Equipo: ${proyecto.team.name}`);
                console.log(`   Célula: ${proyecto.cell.name}`);
                console.log(`   Analista de producto: ${proyecto.analistaProducto}`);
            });
        
        // 3. Contar asignaciones por analista
        console.log('\n=== DISTRIBUCIÓN DE PROYECTOS POR ANALISTA ===');
        const distribucion = {};
        
        analistas.forEach(analista => {
            distribucion[analista.name] = analista.projects.length;
        });
        
        // Ordenar por número de proyectos (de mayor a menor)
        const distribucionOrdenada = Object.entries(distribucion)
            .sort((a, b) => b[1] - a[1])
            .forEach(([nombre, cantidad]) => {
                console.log(`- ${nombre}: ${cantidad} proyectos`);
            });
            
    } catch (error) {
        console.error('Error al verificar relaciones:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarProyectosAnalistas()
    .then(() => console.log('\nVerificación completada.'))
    .catch(err => console.error('Error en la ejecución:', err));
