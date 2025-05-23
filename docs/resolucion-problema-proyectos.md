# Resolución del problema de estados de proyectos y duplicados en PostgreSQL

## Problemas identificados

1. **Todos los proyectos mostraban estado "Certificado"**:
   - Causa: El método `calcularEstadoCalculado` en `ProjectPrismaService.ts` verificaba únicamente si existía una fecha de certificación, sin importar si esa fecha era en el pasado o en el futuro.
   - Solución: Se modificó el método para comprobar que la fecha de certificación sea menor o igual a la fecha actual.

2. **Proyectos duplicados en la base de datos**:
   - Causa: Durante la migración a PostgreSQL, algunos proyectos fueron insertados múltiples veces.
   - Solución: Se creó un script para limpiar la base de datos y migrar nuevamente los proyectos, evitando duplicados.

## Soluciones implementadas

### 1. Corrección del cálculo de estados

Se modificó el método `calcularEstadoCalculado` en `ProjectPrismaService.ts`:

```typescript
private calcularEstadoCalculado(project: any): 'Por Iniciar' | 'En Progreso' | 'Certificado' {
    // Si ya tiene un estado calculado definido, usarlo
    if (project.estadoCalculado) return project.estadoCalculado as any;
    
    // Obtener la fecha actual
    const fechaActual = new Date();
    
    // Verificar si tiene fecha de certificación y es menor o igual a la fecha actual
    if (project.fechaCertificacion && new Date(project.fechaCertificacion) <= fechaActual) {
        return "Certificado";
    }
    
    // Verificar si ya ha iniciado
    if (project.fechaInicio && new Date(project.fechaInicio) <= fechaActual) {
        return "En Progreso";
    }
    
    // Por defecto
    return "Por Iniciar";
}
```

### 2. Script para limpieza y migración

Se desarrolló un script (`limpiarProyectos.js`) que realiza las siguientes acciones:

1. Elimina todos los proyectos existentes en la base de datos PostgreSQL
2. Lee los datos desde el archivo `seguimiento.txt`
3. Filtra proyectos duplicados basados en su `idJira`
4. Crea automáticamente equipos y células faltantes
5. Migra los proyectos únicos a la base de datos

El script incluye detección y prevención de duplicados, manejo automático de equipos y células faltantes, y un completo registro de todas las operaciones.

## Resultados

- Se eliminaron 18 proyectos (incluyendo duplicados) de la base de datos
- Se migraron 49 proyectos únicos a la base de datos
- Los proyectos ahora muestran correctamente su estado calculado: "Por Iniciar", "En Progreso" o "Certificado"
- Se crearon automáticamente los equipos y células faltantes

## Recomendaciones para prevenir problemas futuros

1. **Validación de fechas**: Añadir validaciones para asegurar que las fechas en el sistema tienen sentido lógico (por ejemplo, una fecha de certificación no debería ser anterior a la fecha de inicio).

2. **Normalización de IDs**: Implementar un proceso de normalización para los identificadores de proyectos, como JIRA IDs, para evitar problemas con variaciones de formato (ejemplo: "KOIN256" vs "KOIN-256").

3. **Validación de integridad referencial**: Asegurar que los proyectos siempre tengan referencias válidas a equipos y células antes de ser insertados en la base de datos.

4. **Monitoreo de estado**: Implementar un mecanismo de revisión periódica de estados inconsistentes en la base de datos.

5. **Pruebas de migración**: Antes de futuras migraciones, ejecutar pruebas más exhaustivas en un entorno de prueba para detectar problemas similares.
