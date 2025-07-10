/**
 * Script para ejecutar la migración SQL manualmente
 * 
 * Ejecutar con: node prisma/run-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando migración manual de la tabla User...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'user_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir el SQL en comandos separados
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--')); // Filtrar líneas vacías y comentarios
    
    // Ejecutar cada comando SQL por separado
    console.log(`Ejecutando ${sqlCommands.length} comandos SQL para crear la tabla User...`);
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      if (cmd) {
        try {
          await prisma.$executeRawUnsafe(`${cmd};`);
          console.log(`- Comando ${i + 1}/${sqlCommands.length} ejecutado correctamente`);
        } catch (cmdError) {
          // Si es un error porque ya existe el objeto, continuamos
          if (cmdError.meta?.message?.includes('already exists')) {
            console.log(`- Comando ${i + 1}/${sqlCommands.length}: El objeto ya existe, continuando...`);
          } else {
            throw cmdError;
          }
        }
      }
    }
    
    console.log('Migración completada exitosamente.');
    console.log('Ahora puedes crear usuarios con los scripts:');
    console.log('- node prisma/create-admin-user.js');
    console.log('- node prisma/create-analyst-user.js <email del analista> <contraseña>');
    console.log('- node prisma/create-user.js <email> <nombre> <rol> <contraseña>');
  } catch (error) {
    console.error('Error al ejecutar la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
