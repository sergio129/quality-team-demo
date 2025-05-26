// Archivo para la configuración global de migración
// Esto permite centralizar la configuración del feature flag

/**
 * Configuración para la migración a PostgreSQL
 * Esto permite activar o desactivar la migración a nivel global o por servicio
 */
export const migrationConfig = {  // Configuración global - forzado a true para garantizar que todos los servicios usen PostgreSQL
  usePostgres: true,
  
  // Configuración por servicio - forzado a true para garantizar que todos los servicios usen PostgreSQL
  // independientemente de las variables de entorno
  services: {
    analysts: true,
    cells: true,
    teams: true,
    incidents: true,
    testCases: true,
    testPlans: true,
    projects: true,
  },
  
  // Función para verificar si un servicio específico debe usar PostgreSQL
  shouldUsePostgresFor(serviceName: string): boolean {
    const service = serviceName.toLowerCase();
    if (service in this.services) {
      return this.services[service as keyof typeof this.services];
    }
    return this.usePostgres;
  },
  
  // Opciones de logging
  logging: {
    enabled: process.env.MIGRATION_LOGGING === 'true' || process.env.NODE_ENV !== 'production',
    level: process.env.MIGRATION_LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
  },
    // Opciones de fallback - configuración para cuando hay errores con PostgreSQL
  fallback: {
    enabled: false, // Deshabilitamos completamente el fallback a archivos
    logErrors: true,
  }
};
