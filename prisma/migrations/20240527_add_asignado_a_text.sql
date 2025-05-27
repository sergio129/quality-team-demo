-- Agregar columna para almacenar directamente el nombre del responsable
ALTER TABLE "Incident" ADD COLUMN "asignadoA_text" TEXT;

-- Actualizar los registros existentes para llenar la nueva columna
UPDATE "Incident" i 
SET "asignadoA_text" = a.name 
FROM "QAAnalyst" a 
WHERE i."asignadoAId" = a.id;

-- Actualizar la estructura para permitir nulos en asignadoAId
ALTER TABLE "Incident" ALTER COLUMN "asignadoAId" DROP NOT NULL;
