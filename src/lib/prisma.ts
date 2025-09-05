import { PrismaClient } from '@prisma/client';

// Evitar múltiples instancias de Prisma Client en desarrollo
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prevent-hot-reloading-from-creating-new-instances-of-prismaclient

declare global {
  var prisma: PrismaClient | undefined;
}

// Configuración de logs basada en el entorno
const prismaLogConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return ['error']; // Solo errores en producción
  }
  
  // En desarrollo, solo mostrar logs si está habilitado explícitamente
  if (process.env.ENABLE_PRISMA_QUERY_LOGS === 'true') {
    return ['query', 'error', 'warn'];
  }
  
  return ['error', 'warn']; // Solo errores y advertencias en desarrollo
};

export const prisma = global.prisma || new PrismaClient({ 
  log: prismaLogConfig() as any
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}