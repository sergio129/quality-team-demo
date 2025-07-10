/**
 * Script para crear un usuario sin asociarlo a un analista
 * 
 * Ejecutar con: node prisma/create-user.js <email> <nombre> <rol> <contraseña>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener parámetros de la línea de comandos
    const args = process.argv.slice(2);
    const email = args[0];
    const name = args[1];
    const role = args[2]; // Este rol es solo informativo, no se almacena en la tabla User
    const password = args[3] || 'password123'; // Contraseña por defecto si no se proporciona
    
    if (!email || !name) {
      console.error('Error: Debes proporcionar email y nombre del usuario');
      console.log('Uso: node prisma/create-user.js <email> <nombre> <rol> <contraseña>');
      return;
    }
    
    console.log(`Creando usuario con email: ${email}`);
    
    // Verificar si ya existe un usuario con este email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`Ya existe un usuario con el email ${email}`);
      return;
    }
    
    // Datos del nuevo usuario
    const userData = {
      email,
      name,
      password: bcrypt.hashSync(password, 10),
      isActive: true
    };
    
    // Crear el usuario
    const newUser = await prisma.user.create({
      data: userData
    });
    
    console.log(`Usuario creado con éxito. ID: ${newUser.id}`);
    console.log(`Email: ${email}`);
    console.log(`Nombre: ${name}`);
    if (role) console.log(`Rol (informativo): ${role}`);
    console.log(`Contraseña: ${password}`);
    console.log('NOTA: Este usuario no está asociado a ningún analista QA.');
  } catch (error) {
    console.error('Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
