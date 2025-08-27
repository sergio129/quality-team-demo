console.log('=== Verificando configuración ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada');
console.log('USE_POSTGRES:', process.env.USE_POSTGRES || 'No definido (por defecto false)');

// Verificar si podemos conectar a la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL exitosa');

    const count = await prisma.team.count();
    console.log(`📊 Equipos en BD: ${count}`);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
