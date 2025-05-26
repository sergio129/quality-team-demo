// Script para diagnosticar y solucionar problemas con un proyecto específico
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticarProyecto(idJira) {
    console.log(`\n🔍 DIAGNÓSTICO DEL PROYECTO: ${idJira}`);
    
    try {
        // Buscar el proyecto en PostgreSQL
        const proyecto = await prisma.project.findFirst({
            where: { idJira },
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
        
        if (!proyecto) {
            console.log(`❌ El proyecto con idJira ${idJira} NO existe en la base de datos.`);
            return;
        }
        
        console.log(`✅ Proyecto encontrado en la base de datos con ID: ${proyecto.id}`);
        console.log(`📊 DATOS ACTUALES DEL PROYECTO:`);
        
        // Mostramos datos relevantes
        const datos = {
            id: proyecto.id,
            idJira: proyecto.idJira,
            proyecto: proyecto.proyecto,
            estado: proyecto.estado,
            estadoCalculado: proyecto.estadoCalculado,
            equipo: proyecto.team?.name || proyecto.equipoId,
            celula: proyecto.cell?.name || proyecto.celulaId,
            horas: proyecto.horas,
            dias: proyecto.dias,
            fechaEntrega: proyecto.fechaEntrega,
            fechaCertificacion: proyecto.fechaCertificacion,
            analistaProducto: proyecto.analistaProducto,
            analistas: proyecto.analysts?.map(a => a.analyst.name) || []
        };
        
        console.log(JSON.stringify(datos, null, 2));
        
        // Verificar posibles problemas
        const problemas = [];
        
        if (!proyecto.equipoId) {
            problemas.push("Falta el ID de equipo");
        } else {
            // Verificar que el equipo existe
            const equipo = await prisma.team.findUnique({
                where: { id: proyecto.equipoId }
            });
            if (!equipo) problemas.push(`El equipo con ID ${proyecto.equipoId} no existe`);
        }
        
        if (!proyecto.celulaId) {
            problemas.push("Falta el ID de célula");
        } else {
            // Verificar que la célula existe
            const celula = await prisma.cell.findUnique({
                where: { id: proyecto.celulaId }
            });
            if (!celula) problemas.push(`La célula con ID ${proyecto.celulaId} no existe`);
        }
        
        // Verificar fechas
        try {
            new Date(proyecto.fechaEntrega);
        } catch (e) {
            problemas.push("La fecha de entrega no es válida");
        }
        
        if (proyecto.fechaCertificacion) {
            try {
                new Date(proyecto.fechaCertificacion);
            } catch (e) {
                problemas.push("La fecha de certificación no es válida");
            }
        }
        
        // Verificar campos numéricos
        if (typeof proyecto.horas !== 'number') problemas.push("Las horas no son un número");
        if (typeof proyecto.dias !== 'number') problemas.push("Los días no son un número");
        if (typeof proyecto.diasRetraso !== 'number') problemas.push("Los días de retraso no son un número");
        
        if (problemas.length > 0) {
            console.log(`\n⚠️ PROBLEMAS IDENTIFICADOS (${problemas.length}):`);
            problemas.forEach((p, i) => console.log(` ${i + 1}. ${p}`));
        } else {
            console.log(`\n✅ No se han detectado problemas en la estructura del proyecto`);
        }
        
        return { proyecto, problemas };
    } catch (error) {
        console.error(`❌ ERROR REALIZANDO DIAGNÓSTICO:`, error);
    }
}

async function solucionarProblemas(idJira) {
    const diagnostico = await diagnosticarProyecto(idJira);
    
    if (!diagnostico || !diagnostico.proyecto) {
        console.log("No se pudo realizar el diagnóstico correctamente");
        return false;
    }
    
    const { proyecto, problemas } = diagnostico;
    
    if (problemas.length === 0) {
        console.log("No hay problemas que solucionar");
        return true;
    }
    
    console.log(`\n🔧 APLICANDO SOLUCIONES PARA: ${idJira}`);
    
    try {
        // Preparar datos para actualizar
        const dataToUpdate = {};
        let needsUpdate = false;
        
        // Corregir equipo si es necesario
        if (problemas.some(p => p.includes("equipo"))) {
            const defaultTeam = await prisma.team.findFirst();
            if (defaultTeam) {
                dataToUpdate.equipoId = defaultTeam.id;
                console.log(`✅ Corrigiendo equipo: ${defaultTeam.name} (${defaultTeam.id})`);
                needsUpdate = true;
            }
        }
        
        // Corregir célula si es necesario
        if (problemas.some(p => p.includes("célula"))) {
            const defaultCell = await prisma.cell.findFirst();
            if (defaultCell) {
                dataToUpdate.celulaId = defaultCell.id;
                console.log(`✅ Corrigiendo célula: ${defaultCell.name} (${defaultCell.id})`);
                needsUpdate = true;
            }
        }
        
        // Corregir fechas si es necesario
        if (problemas.some(p => p.includes("fecha de entrega"))) {
            const today = new Date();
            dataToUpdate.fechaEntrega = today;
            console.log(`✅ Corrigiendo fecha de entrega: ${today.toISOString()}`);
            needsUpdate = true;
        }
        
        if (problemas.some(p => p.includes("fecha de certificación"))) {
            dataToUpdate.fechaCertificacion = null;
            console.log(`✅ Eliminando fecha de certificación inválida`);
            needsUpdate = true;
        }
        
        // Corregir campos numéricos
        if (problemas.some(p => p.includes("horas"))) {
            dataToUpdate.horas = 0;
            console.log(`✅ Corrigiendo horas: 0`);
            needsUpdate = true;
        }
        
        if (problemas.some(p => p.includes("días"))) {
            dataToUpdate.dias = 0;
            console.log(`✅ Corrigiendo días: 0`);
            needsUpdate = true;
        }
        
        if (problemas.some(p => p.includes("días de retraso"))) {
            dataToUpdate.diasRetraso = 0;
            console.log(`✅ Corrigiendo días de retraso: 0`);
            needsUpdate = true;
        }
        
        // Aplicar actualizaciones si es necesario
        if (needsUpdate) {
            await prisma.project.update({
                where: { id: proyecto.id },
                data: dataToUpdate
            });
            console.log(`✅ Proyecto actualizado correctamente`);
        } else {
            console.log(`ℹ️ No se requieren actualizaciones automáticas`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ ERROR APLICANDO SOLUCIONES:`, error);
        return false;
    }
}

// Función principal
async function main() {
    const idJira = process.argv[2];
    
    if (!idJira) {
        console.log("Por favor proporciona un ID de Jira como argumento");
        console.log("Ejemplo: node solucionar-proyecto.js BCBH-504");
        return;
    }
    
    console.log(`🛠️  INICIANDO DIAGNÓSTICO Y REPARACIÓN DEL PROYECTO: ${idJira}`);
    
    try {
        await solucionarProblemas(idJira);
    } catch (error) {
        console.error("Error en el proceso:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
main();
