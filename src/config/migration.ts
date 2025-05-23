// Archivo para la configuración global de migración
// Esto permite centralizar la configuración del feature flag

/**
 * Configuración para la migración a PostgreSQL
 * Esto permite activar o desactivar la migración a nivel global o por servicio
 */
export const migrationConfig = {
  // Configuración global - si es true, todos los servicios intentarán usar PostgreSQL por defecto
  usePostgres: process.env.USE_POSTGRES === 'true',
  
  // Configuración por servicio - permite controlar qué servicios específicos usan PostgreSQL
  // independientemente de la configuración global
  services: {
    analysts: process.env.USE_POSTGRES_ANALYSTS === 'true' || process.env.USE_POSTGRES === 'true',
    cells: process.env.USE_POSTGRES_CELLS === 'true' || process.env.USE_POSTGRES === 'true',
    teams: process.env.USE_POSTGRES_TEAMS === 'true' || process.env.USE_POSTGRES === 'true',
    incidents: process.env.USE_POSTGRES_INCIDENTS === 'true' || process.env.USE_POSTGRES === 'true',
    testCases: process.env.USE_POSTGRES_TESTCASES === 'true' || process.env.USE_POSTGRES === 'true',
    testPlans: process.env.USE_POSTGRES_TESTPLANS === 'true' || process.env.USE_POSTGRES === 'true',
    projects: process.env.USE_POSTGRES_PROJECTS === 'true' || process.env.USE_POSTGRES === 'true',
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
    enabled: process.env.MIGRATION_FALLBACK !== 'false', // Por defecto es true
    logErrors: true,
  }
};
