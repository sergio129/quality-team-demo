/**
 * Script para crear un usuario para un analista específico
 * 
 * Ejecutar con: node prisma/create-analyst-user.js <email del analista> <contraseña>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener parámetros de la línea de comandos
    const args = process.argv.slice(2);
    const analystEmail = args[0];
    const password = args[1] || 'password123'; // Contraseña por defecto si no se proporciona
    
    if (!analystEmail) {
      console.error('Error: Debes proporcionar el email del analista');
      console.log('Uso: node prisma/create-analyst-user.js <email del analista> <contraseña>');
      return;
    }
    
    console.log(`Buscando analista con email: ${analystEmail}`);
    
    // Buscar el analista por email
    const analyst = await prisma.qAAnalyst.findUnique({
      where: {
        email: analystEmail
      }
    });
    
    if (!analyst) {
      console.error(`No se encontró ningún analista con email: ${analystEmail}`);
      return;
    }
    
    console.log(`Se encontró al analista: ${analyst.name} (${analyst.role})`);
    
    // Verificar si ya existe un usuario para este analista
    const existingUser = await prisma.user.findUnique({
      where: { analystId: analyst.id }
    });
    
    if (existingUser) {
      console.log(`El analista ${analyst.name} ya tiene un usuario asociado.`);
      return;
    }
    
    // Datos del nuevo usuario
    const userData = {
      email: analyst.email, // Usar el mismo email que el analista
      name: analyst.name,   // Usar el mismo nombre que el analista
      password: bcrypt.hashSync(password, 10),
      isActive: true,
      analystId: analyst.id
    };
    
    // Verificar si ya existe un usuario con este email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUserByEmail) {
      console.log(`Ya existe un usuario con el email ${userData.email}`);
      return;
    }
    
    // Crear el usuario
    const newUser = await prisma.user.create({
      data: userData
    });
    
    console.log(`Usuario creado con éxito para ${analyst.name}. ID: ${newUser.id}`);
    console.log(`Email: ${analyst.email}`);
    console.log(`Contraseña: ${password}`);
    console.log(`Rol: ${analyst.role}`);
  } catch (error) {
    console.error('Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
