// Configuración de la conexión a la base de datos PostgreSQL
import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL;

// Verificamos que la URL de conexión esté definida
if (!DATABASE_URL) {
  console.error('La variable de entorno DATABASE_URL no está definida');
  process.exit(1);
}

// Exportamos la configuración
export const dbConfig = {
  url: DATABASE_URL,
  prisma: new PrismaClient(),
};