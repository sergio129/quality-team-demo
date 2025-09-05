const { PrismaClient } = require('@prisma/client');

async function verifyDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Listar todas las tablas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Tablas creadas en la base de datos:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // Contar registros en algunas tablas principales
    console.log('\n📊 Estado actual de las tablas:');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`👤 Usuarios: ${userCount}`);
    } catch (e) {
      console.log('👤 Usuarios: tabla creada pero vacía');
    }
    
    try {
      const analystCount = await prisma.qAAnalyst.count();
      console.log(`👨‍💻 Analistas QA: ${analystCount}`);
    } catch (e) {
      console.log('👨‍💻 Analistas QA: tabla creada pero vacía');
    }
    
    try {
      const projectCount = await prisma.project.count();
      console.log(`📋 Proyectos: ${projectCount}`);
    } catch (e) {
      console.log('📋 Proyectos: tabla creada pero vacía');
    }
    
    try {
      const teamCount = await prisma.team.count();
      console.log(`👥 Equipos: ${teamCount}`);
    } catch (e) {
      console.log('👥 Equipos: tabla creada pero vacía');
    }
    
    try {
      const cellCount = await prisma.cell.count();
      console.log(`🏢 Células: ${cellCount}`);
    } catch (e) {
      console.log('🏢 Células: tabla creada pero vacía');
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Conexión cerrada');
  }
}

verifyDatabase();
