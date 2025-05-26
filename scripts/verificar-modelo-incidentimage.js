// Verificar si el modelo IncidentImage está disponible en el cliente de Prisma
const { PrismaClient } = require('@prisma/client');

async function verificarModelo() {
    const prisma = new PrismaClient();
    try {
        console.log('Modelos disponibles en el cliente de Prisma:');
        // Mostrar todos los modelos disponibles en el cliente
        console.log(Object.keys(prisma));

        if (prisma.incidentImage) {
            console.log('El modelo IncidentImage existe en el cliente de Prisma');
            
            // Intentar contar registros para verificar la conexión
            try {
                const count = await prisma.incidentImage.count();
                console.log(`Total de imágenes en la base de datos: ${count}`);
            } catch (countError) {
                console.error('Error al contar imágenes:', countError);
            }
        } else {
            console.error('El modelo IncidentImage NO existe en el cliente de Prisma');
        }

        // Verificar el modelo Incident para comparar
        if (prisma.incident) {
            console.log('El modelo Incident existe en el cliente de Prisma');
            
            try {
                const count = await prisma.incident.count();
                console.log(`Total de incidentes en la base de datos: ${count}`);
                
                // Verificar la relación con las imágenes
                const incidentConRelaciones = await prisma.incident.findFirst({
                    include: {
                        imagenes: true
                    }
                });
                
                if (incidentConRelaciones) {
                    console.log('Relación con imagenes está disponible');
                } else {
                    console.log('No se encontraron incidentes o la relación no está disponible');
                }
            } catch (incidentError) {
                console.error('Error al verificar incidentes:', incidentError);
            }
        } else {
            console.error('El modelo Incident NO existe en el cliente de Prisma');
        }
    } catch (error) {
        console.error('Error al verificar el modelo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarModelo();
