-- Script para crear la tabla User en PostgreSQL

-- Crear extensión uuid-ossp si no existe (para gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla User
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "analystId" UUID UNIQUE
);

-- Establecer clave primaria
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Establecer restricción de unicidad en email
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");

-- Establecer clave foránea para analystId
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_analystId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_analystId_fkey" 
  FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE SET NULL;

-- Crear índice para búsquedas por email
DROP INDEX IF EXISTS "User_email_idx";
CREATE INDEX "User_email_idx" ON "User"("email");

-- Crear índice para búsquedas por analista
DROP INDEX IF EXISTS "User_analystId_idx";
CREATE INDEX "User_analystId_idx" ON "User"("analystId");

-- Actualizar el campo updatedAt automáticamente
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updatedAt
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
