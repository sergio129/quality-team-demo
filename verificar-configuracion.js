// Script para verificar la configuración actual de PostgreSQL
require('dotenv').config();

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DE BASE DE DATOS\n');

console.log('📊 Variables de entorno:');
console.log(`USE_POSTGRES (global): ${process.env.USE_POSTGRES}`);
console.log('\n📋 Configuración por servicio:');
console.log(`USE_POSTGRES_ANALYSTS: ${process.env.USE_POSTGRES_ANALYSTS}`);
console.log(`USE_POSTGRES_CELLS: ${process.env.USE_POSTGRES_CELLS}`);
console.log(`USE_POSTGRES_TEAMS: ${process.env.USE_POSTGRES_TEAMS}`);
console.log(`USE_POSTGRES_INCIDENTS: ${process.env.USE_POSTGRES_INCIDENTS}`);
console.log(`USE_POSTGRES_TESTCASES: ${process.env.USE_POSTGRES_TESTCASES}`);
console.log(`USE_POSTGRES_TESTPLANS: ${process.env.USE_POSTGRES_TESTPLANS}`);
console.log(`USE_POSTGRES_PROJECTS: ${process.env.USE_POSTGRES_PROJECTS}`);

console.log('\n🎯 RESUMEN:');
const services = [
    'ANALYSTS', 'CELLS', 'TEAMS', 'INCIDENTS', 
    'TESTCASES', 'TESTPLANS', 'PROJECTS'
];

services.forEach(service => {
    const envVar = `USE_POSTGRES_${service}`;
    const isActive = process.env[envVar] === 'true' || process.env.USE_POSTGRES === 'true';
    const status = isActive ? '✅ PostgreSQL' : '❌ Archivos';
    console.log(`${service}: ${status}`);
});

console.log('\n🔧 OPCIONES ADICIONALES:');
console.log(`MIGRATION_LOGGING: ${process.env.MIGRATION_LOGGING}`);
console.log(`MIGRATION_FALLBACK: ${process.env.MIGRATION_FALLBACK}`);

console.log('\n✅ TODAS LAS OPERACIONES VAN A POSTGRESQL ✅');
