// Script para configurar la base de datos en Vercel
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando configuración de la base de datos para Vercel...');

// Asegurarse de que DATABASE_URL está configurado correctamente
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definido en las variables de entorno.');
  process.exit(1);
}

console.log('📊 Creando tablas en la base de datos...');

// Ejecutar Prisma db push para crear las tablas
exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error al ejecutar prisma db push:', error);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log('✅ Tablas creadas exitosamente:');
  console.log(stdout);
  
  console.log('🔄 Generando cliente Prisma actualizado...');
  
  // Generar el cliente Prisma
  exec('npx prisma generate', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error al generar el cliente Prisma:', error);
      console.error(stderr);
      process.exit(1);
    }
    
    console.log('✅ Cliente Prisma generado exitosamente:');
    console.log(stdout);
    
    console.log('🎉 Configuración de la base de datos completada.');
  });
});
