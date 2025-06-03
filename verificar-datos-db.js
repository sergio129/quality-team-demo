const { PrismaClient } = require('@prisma/client');

async function verificarDatos() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== VERIFICANDO DATOS EN BASE DE DATOS ===');
      // Verificar incidentes
    const incidentes = await prisma.incident.findMany({
      select: {
        id: true,
        descripcion: true,
        estado: true,
        prioridad: true,
        fechaCreacion: true,
        idJira: true
      }
    });
    console.log(`\n📊 INCIDENTES: ${incidentes.length}`);
    if (incidentes.length > 0) {
      console.log('Primeros 3 incidentes:');
      incidentes.slice(0, 3).forEach(inc => {
        console.log(`  - ${inc.id}: ${inc.descripcion?.substring(0, 50)}... (${inc.estado}, ${inc.prioridad})`);
      });
    }
    
    // Verificar casos de prueba
    const casosPrueba = await prisma.testCase.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        projectId: true,
        cycle: true
      }
    });
    console.log(`\n📋 CASOS DE PRUEBA: ${casosPrueba.length}`);
    if (casosPrueba.length > 0) {
      console.log('Estados de casos de prueba:');
      const estados = {};
      casosPrueba.forEach(caso => {
        estados[caso.status] = (estados[caso.status] || 0) + 1;
      });
      Object.entries(estados).forEach(([estado, count]) => {
        console.log(`  - ${estado}: ${count}`);
      });
    }
    
    // Verificar proyectos
    const proyectos = await prisma.project.findMany({
      select: {
        id: true,
        proyecto: true,
        idJira: true,
        estado: true
      }
    });
    console.log(`\n🏗️ PROYECTOS: ${proyectos.length}`);
    if (proyectos.length > 0) {
      console.log('Primeros 3 proyectos:');
      proyectos.slice(0, 3).forEach(proj => {
        console.log(`  - ${proj.id}: ${proj.proyecto} (${proj.idJira})`);
      });
    }
      // Verificar relaciones entre casos de prueba y defectos
    const relacionesDefectos = await prisma.defectRelation.findMany({
      include: {
        testCase: { select: { name: true } },
        incident: { select: { descripcion: true } }
      }
    });
    console.log(`\n🔗 RELACIONES CASOS-DEFECTOS: ${relacionesDefectos.length}`);
    
    // Verificar analistas
    const analistas = await prisma.qAAnalyst.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    console.log(`\n👥 ANALISTAS: ${analistas.length}`);
    
    // Verificar células
    const celulas = await prisma.cell.findMany({
      select: {
        id: true,
        name: true
      }
    });
    console.log(`\n🏢 CÉLULAS: ${celulas.length}`);
    
    console.log('\n=== RESUMEN ===');
    console.log(`Total incidentes: ${incidentes.length}`);
    console.log(`Total casos de prueba: ${casosPrueba.length}`);
    console.log(`Total proyectos: ${proyectos.length}`);
    console.log(`Total analistas: ${analistas.length}`);
    console.log(`Total células: ${celulas.length}`);
    
  } catch (error) {
    console.error('Error verificando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDatos();
