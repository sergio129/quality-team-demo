const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIncidentCreation() {
    console.log('🧪 Probando creación de incidentes sin generar analistas...\n');
    
    try {
        // Contar analistas antes de la prueba
        const analystsBefore = await prisma.qAAnalyst.count();
        console.log(`📊 Analistas antes de la prueba: ${analystsBefore}`);
        
        // Crear un incidente de prueba con un "asignadoA" que no existe
        const testIncident = {
            estado: 'Abierto',
            prioridad: 'Media',
            descripcion: 'Incidente de prueba para verificar corrección',
            fechaCreacion: new Date(),
            fechaReporte: new Date(),
            cliente: 'Cliente Test',
            asignadoA: 'Juan Pérez - Analista Ficticio', // Este nombre no debería crear un analista
            informadoPor: 'Leidy Johana IRAL', // Este tampoco
            celula: 'Comdata'
        };
        
        console.log('🔧 Creando incidente de prueba...');
        console.log(`   - Asignado a: "${testIncident.asignadoA}"`);
        console.log(`   - Informado por: "${testIncident.informadoPor}"`);
          // Simular el proceso de creación (usando la lógica del servicio)
        const response = await fetch('http://localhost:3000/api/incidents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testIncident),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en la respuesta:', response.status, errorText);
            return;
        }
        
        const createdIncident = await response.json();
        console.log('✅ Incidente creado exitosamente');
        console.log(`   - ID: ${createdIncident.id}`);
        console.log(`   - Asignado a: "${createdIncident.asignadoA}"`);
        
        // Contar analistas después de la prueba
        const analystsAfter = await prisma.qAAnalyst.count();
        console.log(`📊 Analistas después de la prueba: ${analystsAfter}`);
        
        // Verificar que no se crearon nuevos analistas
        if (analystsAfter === analystsBefore) {
            console.log('🎉 ¡ÉXITO! No se crearon nuevos analistas');
        } else {
            console.log(`⚠️  ADVERTENCIA: Se crearon ${analystsAfter - analystsBefore} nuevos analistas`);
        }
        
        // Verificar que el campo asignadoA_text se guardó correctamente
        const savedIncident = await prisma.incident.findUnique({
            where: { id: createdIncident.id },
            select: {
                asignadoA_text: true,
                asignadoAId: true,
                asignadoA: true
            }
        });
        
        console.log('\n📋 Verificación de campos guardados:');
        console.log(`   - asignadoA_text: "${savedIncident.asignadoA_text}"`);
        console.log(`   - asignadoAId: ${savedIncident.asignadoAId}`);
        console.log(`   - Relación asignadoA: ${savedIncident.asignadoA ? 'SÍ EXISTE' : 'null'}`);
        
        // Limpiar - eliminar el incidente de prueba
        await prisma.incident.delete({
            where: { id: createdIncident.id }
        });
        console.log('🧹 Incidente de prueba eliminado');
        
    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar solo si este archivo se ejecuta directamente
if (require.main === module) {
    testIncidentCreation();
}

module.exports = { testIncidentCreation };
