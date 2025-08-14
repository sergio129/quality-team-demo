-- Migración para agregar el campo horasPorDia al modelo Project
ALTER TABLE "Project" ADD COLUMN "horasPorDia" DOUBLE PRECISION[];

-- Comentario explicativo
COMMENT ON COLUMN "Project"."horasPorDia" IS 'Array de horas distribuidas por día para el proyecto';
