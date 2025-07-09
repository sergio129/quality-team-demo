const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarEstadisticasAnalistas() {
    console.log('🔍 Verificando datos para estadísticas de analistas...\n');
    
    try {
        // Obtener todos los analistas
        const analistas = await prisma.qAAnalyst.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        
        console.log(`👥 Total de analistas: ${analistas.length}`);
        
        for (const analista of analistas) {
            console.log(`\n📊 Analista: ${analista.name} (${analista.role})`);
            console.log(`   ID: ${analista.id}`);
            
            // Incidentes reportados por este analista
            const incidentesReportados = await prisma.incident.findMany({
                where: { informadoPor: { name: analista.name } },
                select: {
                    id: true,
                    descripcion: true,
                    estado: true,
                    prioridad: true,
                    fechaCreacion: true,
                    fechaSolucion: true,
                    tipoBug: true
                }
            });
            
            // Incidentes asignados a este analista (usando el campo de texto)
            const incidentesAsignados = await prisma.incident.findMany({
                where: { asignadoA_text: analista.name },
                select: {
                    id: true,
                    descripcion: true,
                    estado: true,
                    prioridad: true,
                    fechaCreacion: true,
                    fechaSolucion: true,
                    tipoBug: true
                }
            });
            
            console.log(`   📈 Incidentes reportados: ${incidentesReportados.length}`);
            console.log(`   📋 Incidentes asignados: ${incidentesAsignados.length}`);
            
            // Mostrar detalles de los incidentes reportados
            if (incidentesReportados.length > 0) {
                console.log(`   ┌─ Incidentes reportados:`);
                incidentesReportados.forEach(inc => {
                    console.log(`   │  - ${inc.id}: ${inc.descripcion?.substring(0, 30)}... (${inc.estado}, ${inc.prioridad})`);
                });
            }
            
            // Mostrar detalles de los incidentes asignados
            if (incidentesAsignados.length > 0) {
                console.log(`   ┌─ Incidentes asignados:`);
                incidentesAsignados.forEach(inc => {
                    console.log(`   │  - ${inc.id}: ${inc.descripcion?.substring(0, 30)}... (${inc.estado}, ${inc.prioridad})`);
                });
            }
            
            // Estadísticas por prioridad de incidentes reportados
            const porPrioridad = {
                Alta: incidentesReportados.filter(i => i.prioridad === 'Alta').length,
                Media: incidentesReportados.filter(i => i.prioridad === 'Media').length,
                Baja: incidentesReportados.filter(i => i.prioridad === 'Baja').length
            };
            
            // Estadísticas por tipo de bug
            const porTipo = {
                UI: incidentesReportados.filter(i => i.tipoBug === 'UI').length,
                Funcional: incidentesReportados.filter(i => i.tipoBug === 'Funcional').length,
                Performance: incidentesReportados.filter(i => i.tipoBug === 'Performance').length,
                Seguridad: incidentesReportados.filter(i => i.tipoBug === 'Seguridad').length,
                Otro: incidentesReportados.filter(i => !i.tipoBug || i.tipoBug === 'Otro').length
            };
            
            console.log(`   📊 Por prioridad:`, porPrioridad);
            console.log(`   🐛 Por tipo:`, porTipo);
            
            // Incidentes resueltos
            const resueltos = incidentesAsignados.filter(i => i.estado === 'Resuelto' || i.estado === 'Cerrado');
            console.log(`   ✅ Incidentes resueltos: ${resueltos.length}`);
            
            // Tiempo promedio de resolución
            if (resueltos.length > 0) {
                let tiempoTotal = 0;
                let contador = 0;
                
                resueltos.forEach(inc => {
                    if (inc.fechaSolucion && inc.fechaCreacion) {
                        const tiempoDias = (new Date(inc.fechaSolucion).getTime() - new Date(inc.fechaCreacion).getTime()) / (1000 * 60 * 60 * 24);
                        tiempoTotal += tiempoDias;
                        contador++;
                    }
                });
                
                if (contador > 0) {
                    const promedio = (tiempoTotal / contador).toFixed(1);
                    console.log(`   ⏱️  Tiempo promedio de resolución: ${promedio} días`);
                }
            }
        }
        
        // Resumen general
        console.log('\n📋 RESUMEN GENERAL:');
        const totalIncidentes = await prisma.incident.count();
        const incidentesAbiertos = await prisma.incident.count({
            where: {
                AND: [
                    { fechaSolucion: null },
                    { estado: { not: 'Resuelto' } }
                ]
            }
        });
        
        console.log(`   Total de incidentes: ${totalIncidentes}`);
        console.log(`   Incidentes abiertos: ${incidentesAbiertos}`);
        console.log(`   Incidentes resueltos: ${totalIncidentes - incidentesAbiertos}`);
        
        // Verificar si hay incidentes con datos válidos para estadísticas
        const incidentesConTipoBug = await prisma.incident.count({
            where: { tipoBug: { not: null } }
        });
          const incidentesConPrioridad = await prisma.incident.count({
            where: { 
                prioridad: { 
                    not: null 
                }
            }
        });
        
        console.log(`   Incidentes con tipo de bug: ${incidentesConTipoBug}`);
        console.log(`   Incidentes con prioridad: ${incidentesConPrioridad}`);
        
    } catch (error) {
        console.error('❌ Error verificando estadísticas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la verificación
verificarEstadisticasAnalistas();
