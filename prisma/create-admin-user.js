/**
 * Script para crear un usuario administrador inicial
 * 
 * Ejecutar con: node prisma/create-admin-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando creación de usuario administrador...');
    
    // Buscar un analista QA Leader para asignarlo como administrador
    const qaLeader = await prisma.qAAnalyst.findFirst({
      where: {
        role: 'QA Leader'
      }
    });

    if (!qaLeader) {
      console.error('No se encontró ningún analista con rol "QA Leader"');
      console.log('Creando usuario administrador sin asociar a un analista...');
    } else {
      console.log(`Se encontró analista QA Leader: ${qaLeader.name}`);
      
      // Verificar si ya existe un usuario para este analista
      const existingUser = await prisma.user.findUnique({
        where: { analystId: qaLeader.id }
      });
      
      if (existingUser) {
        console.log(`El analista ${qaLeader.name} ya tiene un usuario asociado.`);
        return;
      }
    }
    
    // Datos del usuario administrador
    const adminUserData = {
      email: 'admin@quality-team.com',
      name: 'Administrador',
      password: bcrypt.hashSync('admin123', 10), // Cambiar esta contraseña en producción
      isActive: true,
      analystId: qaLeader?.id || null
    };
    
    // Verificar si ya existe un usuario con este email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: adminUserData.email }
    });
    
    if (existingUserByEmail) {
      console.log(`Ya existe un usuario con el email ${adminUserData.email}`);
      return;
    }
    
    // Crear el usuario administrador
    const newUser = await prisma.user.create({
      data: adminUserData
    });
    
    console.log(`Usuario administrador creado con éxito. ID: ${newUser.id}`);
    console.log('Email: admin@quality-team.com');
    console.log('Contraseña: admin123');
    
    if (newUser.analystId) {
      console.log(`Asociado al analista: ${qaLeader.name}`);
    } else {
      console.log('El usuario no está asociado a ningún analista QA.');
    }
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
