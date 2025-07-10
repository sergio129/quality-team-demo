/**
 * Script para configurar la tabla User manualmente y crear un usuario administrador
 * 
 * Ejecutar con: node prisma/setup-user-table.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando configuración de la tabla User y usuario admin...');
    
    // 1. Crear la tabla User directamente con Prisma
    console.log('Creando tabla User...');
    
    try {
      // Primero verificar si la tabla ya existe
      const tableExistsQuery = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'User'
        ) as "exists";
      `;
      
      const tableExists = tableExistsQuery[0].exists;
      
      if (!tableExists) {
        // Intentar crear extensión uuid-ossp si no existe
        try {
          await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
          console.log('Extensión uuid-ossp habilitada o ya existente.');
        } catch (extError) {
          console.warn('No se pudo crear la extensión uuid-ossp:', extError.message);
          console.log('Continuando sin la extensión...');
        }
        
        // Crear la tabla User usando SQL básico
        await prisma.$executeRawUnsafe(`
          CREATE TABLE "User" (
            "id" UUID NOT NULL,
            "email" VARCHAR(255) NOT NULL,
            "password" VARCHAR(255) NOT NULL,
            "name" VARCHAR(255) NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "lastLogin" TIMESTAMP WITH TIME ZONE,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "analystId" UUID UNIQUE,
            PRIMARY KEY ("id")
          );
        `);
        
        // Crear restricciones e índices
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");`);
        await prisma.$executeRawUnsafe(`CREATE INDEX "User_email_idx" ON "User"("email");`);
        await prisma.$executeRawUnsafe(`CREATE INDEX "User_analystId_idx" ON "User"("analystId");`);
        
        // Crear clave foránea si la tabla QAAnalyst existe
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "User" ADD CONSTRAINT "User_analystId_fkey" 
            FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE SET NULL;
          `);
          console.log('Clave foránea creada correctamente.');
        } catch (fkError) {
          console.warn('No se pudo crear la clave foránea. Es posible que la tabla QAAnalyst no exista todavía.');
          console.warn(fkError.message);
        }
        
        console.log('Tabla User creada correctamente.');
      } else {
        console.log('La tabla User ya existe, omitiendo creación.');
      }
    } catch (tableError) {
      console.error('Error al crear la tabla User:', tableError);
      throw tableError;
    }
    
    // 2. Buscar un analista con rol QA Leader para crear un usuario administrador
    console.log('\nBuscando analista QA Leader para crear usuario admin...');
    
    try {
      const qaLeader = await prisma.qAAnalyst.findFirst({
        where: { role: 'QA Leader' }
      });
      
      if (qaLeader) {
        console.log(`Encontrado QA Leader: ${qaLeader.name} (${qaLeader.email})`);
        
        // Verificar si ya existe un usuario para este analista
        const existingUser = await prisma.user.findFirst({
          where: { analystId: qaLeader.id }
        });
        
        if (existingUser) {
          console.log(`El analista ya tiene un usuario asociado: ${existingUser.email}`);
        } else {
          // Verificar si ya existe un usuario con el mismo email
          const existingUserByEmail = await prisma.user.findFirst({
            where: { email: qaLeader.email }
          });
          
          if (existingUserByEmail) {
            console.log(`Ya existe un usuario con el email ${qaLeader.email}`);
          } else {
            // Crear el usuario administrador
            const adminUser = await prisma.user.create({
              data: {
                id: require('crypto').randomUUID(), // Generar UUID manualmente
                email: qaLeader.email,
                name: qaLeader.name,
                password: bcrypt.hashSync('admin123', 10),
                isActive: true,
                analystId: qaLeader.id
              }
            });
            
            console.log(`Usuario administrador creado: ${adminUser.email} (contraseña: admin123)`);
          }
        }
      } else {
        console.log('No se encontró ningún analista con rol QA Leader.');
        console.log('Creando usuario admin genérico...');
        
        // Verificar si ya existe un usuario admin genérico
        const existingAdmin = await prisma.user.findFirst({
          where: { email: 'admin@quality-team.com' }
        });
        
        if (existingAdmin) {
          console.log('El usuario admin@quality-team.com ya existe.');
        } else {
          // Crear un usuario admin genérico
          const adminUser = await prisma.user.create({
            data: {
              id: require('crypto').randomUUID(), // Generar UUID manualmente
              email: 'admin@quality-team.com',
              name: 'Administrador',
              password: bcrypt.hashSync('admin123', 10),
              isActive: true
            }
          });
          
          console.log(`Usuario administrador genérico creado: ${adminUser.email} (contraseña: admin123)`);
        }
      }
    } catch (userError) {
      console.error('Error al crear el usuario administrador:', userError);
    }
    
    console.log('\nConfiguración completada.');
    
  } catch (error) {
    console.error('Error durante la configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
