// Script para verificar relaciones entre usuarios y analistas
// Identifica problemas de tipo de datos y analistas sin usuario

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarRelacionesUsuarios() {
  console.log('Verificando relaciones entre usuarios y analistas de QA...');
  
  try {
    // 1. Obtener todos los usuarios con sus analistas asociados
    const usuarios = await prisma.user.findMany({
      include: {
        analyst: true
      }
    });
    
    console.log(`\n=== USUARIOS (${usuarios.length}) ===`);
    usuarios.forEach(user => {
      console.log(`- Usuario: ${user.name} (${user.email})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Analista ID: ${user.analystId || 'No asignado'}`);
      console.log(`  Analista encontrado: ${user.analyst ? 'Sí' : 'No'}`);
      if (user.analystId && !user.analyst) {
        console.log('  ⚠️ ERROR: El analista asociado no existe o hay problema de tipo de datos');
      }
    });
    
    // 2. Obtener todos los analistas con sus usuarios asociados
    const analistas = await prisma.qAAnalyst.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`\n=== ANALISTAS (${analistas.length}) ===`);
    
    // Contar analistas con y sin usuario
    const analistasConUsuario = analistas.filter(a => a.user).length;
    const analistasSinUsuario = analistas.filter(a => !a.user).length;
    
    console.log(`Analistas con usuario: ${analistasConUsuario}`);
    console.log(`Analistas sin usuario: ${analistasSinUsuario}`);
    
    console.log('\n=== ANALISTAS SIN USUARIO ===');
    analistas
      .filter(a => !a.user)
      .forEach(analista => {
        console.log(`- ${analista.name} (${analista.email})`);
        console.log(`  ID: ${analista.id}`);
        console.log(`  Rol: ${analista.role}`);
      });
      
    // 3. Verificar problemas de tipo de datos
    // Ejecutar consulta directa para detectar inconsistencias
    const inconsistencias = await prisma.$queryRaw`
      SELECT u.id as user_id, u.name as user_name, u."analystId", 
             qa.id as analyst_id, qa.name as analyst_name
      FROM "User" u
      LEFT JOIN "QAAnalyst" qa ON u."analystId"::text = qa.id::text
      WHERE u."analystId" IS NOT NULL
        AND qa.id IS NULL
    `;
    
    if (inconsistencias.length > 0) {
      console.log('\n⚠️ INCONSISTENCIAS DETECTADAS:');
      console.log('Los siguientes usuarios tienen analistas asignados que no se encuentran:');
      
      inconsistencias.forEach(inc => {
        console.log(`- Usuario: ${inc.user_name} (ID: ${inc.user_id})`);
        console.log(`  AnalystId: ${inc.analystId}`);
      });
      
      console.log('\nPosibles soluciones:');
      console.log('1. Verificar que los IDs de analista sean válidos');
      console.log('2. Ejecutar consultas para corregir problemas de tipo de datos');
    } else {
      console.log('\n✅ No se encontraron inconsistencias de tipo de datos');
    }
    
  } catch (error) {
    console.error('Error al verificar relaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarRelacionesUsuarios()
  .then(() => console.log('\nVerificación completada.'))
  .catch(err => console.error('Error en la ejecución:', err));
