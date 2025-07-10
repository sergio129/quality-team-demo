// Script para sincronizar las asignaciones entre proyectos y analistas
// basándose en el campo analistaProducto

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sincronizarProyectosAnalistas() {
    console.log('Sincronizando relaciones entre proyectos y analistas...');
    
    try {
        // 1. Obtener todos los analistas
        const analistas = await prisma.qAAnalyst.findMany();
        console.log(`Encontrados ${analistas.length} analistas`);
        
        // Crear un mapa de nombres a IDs de analistas
        const mapaAnalistas = {};
        for (const analista of analistas) {
            mapaAnalistas[analista.name] = analista.id;
        }
        
        console.log('Mapa de analistas:');
        for (const [nombre, id] of Object.entries(mapaAnalistas)) {
            console.log(`- ${nombre}: ${id}`);
        }
        
        // 2. Obtener todos los proyectos
        const proyectos = await prisma.project.findMany({
            include: {
                analysts: true
            }
        });
        
        console.log(`Encontrados ${proyectos.length} proyectos`);
        
        // 3. Para cada proyecto, asignar el analista basado en analistaProducto
        let asignacionesCreadas = 0;
        
        for (const proyecto of proyectos) {
            const nombreAnalista = proyecto.analistaProducto;
            const idAnalista = mapaAnalistas[nombreAnalista];
            
            if (!idAnalista) {
                console.log(`⚠️ No se encontró un analista con el nombre: "${nombreAnalista}" para el proyecto ${proyecto.proyecto} (${proyecto.idJira})`);
                continue;
            }
            
            // Verificar si ya existe la asignación
            const asignacionExistente = proyecto.analysts.find(a => a.analystId === idAnalista);
            
            if (!asignacionExistente) {
                // Crear la asignación
                await prisma.projectAnalyst.create({
                    data: {
                        projectId: proyecto.id,
                        analystId: idAnalista
                    }
                });
                
                console.log(`✅ Asignado proyecto ${proyecto.proyecto} (${proyecto.idJira}) al analista ${nombreAnalista}`);
                asignacionesCreadas++;
            } else {
                console.log(`ℹ️ El proyecto ${proyecto.proyecto} (${proyecto.idJira}) ya estaba asignado al analista ${nombreAnalista}`);
            }
        }
        
        console.log(`\nResumen de la sincronización:`);
        console.log(`- Total de proyectos procesados: ${proyectos.length}`);
        console.log(`- Nuevas asignaciones creadas: ${asignacionesCreadas}`);
        
    } catch (error) {
        console.error('Error durante la sincronización:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sincronizarProyectosAnalistas()
    .then(() => console.log('\nSincronización completada.'))
    .catch(err => console.error('Error en la ejecución:', err));
