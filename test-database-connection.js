// Script para diagnosticar problemas de conexión a PostgreSQL
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔍 DIAGNOSTICO DE CONEXIÓN A POSTGRESQL\n');

console.log('📊 Variables de entorno cargadas:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
if (process.env.DATABASE_URL) {
    console.log(`URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
}

console.log('\n🔧 Intentando conectar a la base de datos...');

async function testConnection() {
    const prisma = new PrismaClient({
        log: ['query', 'error', 'warn', 'info']
    });

    try {
        // Intentar una consulta simple
        console.log('📋 Probando conexión...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa a PostgreSQL');

        // Intentar consultar una tabla
        console.log('📋 Probando consulta a tabla QAAnalyst...');
        const count = await prisma.qAAnalyst.count();
        console.log(`✅ Consulta exitosa. Registros encontrados: ${count}`);

        // Intentar consultar otras tablas
        console.log('📋 Probando consulta a tabla Team...');
        const teamCount = await prisma.team.count();
        console.log(`✅ Consulta exitosa. Registros encontrados: ${teamCount}`);

        console.log('📋 Probando consulta a tabla Cell...');
        const cellCount = await prisma.cell.count();
        console.log(`✅ Consulta exitosa. Registros encontrados: ${cellCount}`);

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);

        if (error.code === 'P1001') {
            console.log('\n💡 Soluciones posibles:');
            console.log('1. Verificar que la base de datos esté ejecutándose');
            console.log('2. Verificar las credenciales en DATABASE_URL');
            console.log('3. Verificar la conectividad de red');
        } else if (error.code === 'P2002') {
            console.log('\n💡 Soluciones posibles:');
            console.log('1. Verificar que las tablas existan en la base de datos');
            console.log('2. Ejecutar las migraciones de Prisma');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
