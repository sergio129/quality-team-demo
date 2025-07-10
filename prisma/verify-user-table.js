/**
 * Script para verificar si la tabla User se creó correctamente
 * 
 * Ejecutar con: node prisma/verify-user-table.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando la tabla User...');
    
    // Intentar ejecutar una consulta simple en la tabla User
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'User'
      ) as "tableExists";
    `;
    
    const tableExists = result[0].tableExists;
    
    if (tableExists) {
      console.log('✅ La tabla User existe en la base de datos.');
      
      // Contar usuarios
      const userCount = await prisma.user.count();
      console.log(`Número de usuarios en la tabla: ${userCount}`);
      
      // Verificar estructura de la tabla
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'User'
        ORDER BY ordinal_position;
      `;
      
      console.log('\nEstructura de la tabla User:');
      console.table(columns);
      
      // Verificar claves y restricciones
      const constraints = await prisma.$queryRaw`
        SELECT conname as constraint_name, contype as constraint_type
        FROM pg_constraint
        WHERE conrelid = 'User'::regclass;
      `;
      
      console.log('\nRestricciones de la tabla User:');
      console.table(constraints);
      
      console.log('\nVerificación completada con éxito.');
    } else {
      console.error('❌ La tabla User no existe en la base de datos.');
    }
  } catch (error) {
    console.error('Error al verificar la tabla User:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
