# Problemas Detectados - Migración a PostgreSQL

Este documento registra los problemas encontrados durante la migración a PostgreSQL y sus soluciones.

## Tabla de problemas

| Fecha | Servicio | Problema | Solución | Estado |
|-------|----------|----------|----------|--------|
| 23/05/2025 | TestCaseService | Error "fs is not defined" en los métodos getAllTestCases y getAllTestPlans | Implementación correcta del patrón adaptador para separar servicios de casos y planes | Resuelto |
| 23/05/2025 | TeamPrismaService | Error "Unknown field `members` for include statement on model `Team`" | Corrección en las consultas para usar el campo 'analysts' en lugar de 'members' | Resuelto |
| 23/05/2025 | ProjectPrismaService | Los proyectos mostraban IDs en lugar de nombres para equipos y células | Corrección para incluir los nombres en lugar de solo IDs | Resuelto |
| 23/05/2025 | ProjectPrismaService | Los proyectos mostraban "Sin estado" en la columna ESTADO | Implementación de cálculo automático del estado basado en fechas y atributos | Resuelto |
| 23/05/2025 | ProjectPrismaService | Estados de proyecto no mostrados | Cálculo automático del estado del proyecto basado en otros campos | Resuelto |

## Detalles de problemas

### [23/05/2025] - [TestCaseService] - [Falta implementación correcta del adaptador]

**Descripción:**
El servicio de casos de prueba (`testCaseService.ts`) no estaba implementando correctamente el patrón adaptador. En vez de usar los servicios específicos para casos de prueba y planes de prueba, intentaba acceder directamente al módulo `fs` que no estaba importado.

**Pasos para reproducir:**
1. Activar la migración a PostgreSQL para casos de prueba (`USE_POSTGRES_TESTCASES=true`)
2. Acceder a cualquier ruta que cargue casos de prueba o planes de prueba

**Impacto:**
Error al cargar los casos de prueba y planes de prueba, lo que impedía ver la información en la aplicación.

**Causa raíz:**
El servicio no delegaba correctamente a las implementaciones específicas (archivo o Prisma) y estaba intentando usar directamente el módulo `fs` sin importarlo.

**Solución:**
Se implementaron correctamente dos métodos separados para obtener el servicio adecuado:
- `getTestCaseService()` para casos de prueba
- `getTestPlanService()` para planes de prueba

Se modificaron todos los métodos para usar estas funciones según corresponda, eliminando la dependencia directa del módulo `fs`.

**Lecciones aprendidas:**
Al implementar un patrón adaptador, es importante asegurarse de que todas las funcionalidades deleguen correctamente a las implementaciones específicas y no contengan lógica de acceso a datos directa.

### [23/05/2025] - [TeamPrismaService] - [Campo 'members' no existe en el modelo Team]

**Descripción:**
El servicio Prisma para equipos (`TeamPrismaService`) intenta incluir un campo `members` en la consulta, pero este campo no existe en el modelo `Team` definido en el esquema de Prisma.

**Pasos para reproducir:**
1. Activar la migración a PostgreSQL para equipos (`USE_POSTGRES_TEAMS=true`)
2. Acceder a la lista de equipos o cualquier ruta que cargue información de equipos

**Impacto:**
Error al cargar los equipos desde la base de datos, lo que impide ver la información de equipos en la aplicación.

**Causa raíz:**
El modelo Team en Prisma tiene una relación con los analistas a través de la tabla `TeamAnalyst`, y esta relación se llama `analysts`, pero el servicio estaba intentando acceder a un campo llamado `members` que no existe en el esquema de Prisma.

**Solución:**
Se modificó el servicio `TeamPrismaService` para usar correctamente la relación `analysts` en lugar de `members` en todas las consultas, y para mapear estos datos al formato esperado por la aplicación (donde los miembros se llaman `members`).

**Lecciones aprendidas:**
Al migrar a un ORM como Prisma, es importante asegurarse de que los nombres de las relaciones en el código coincidan exactamente con los definidos en el esquema. Además, cuando se usa una capa adaptadora, es crucial traducir correctamente entre el modelo de datos de la aplicación y el modelo de datos del ORM.

### [23/05/2025] - [ProjectPrismaService] - [Referencia a IDs en lugar de nombres]

**Descripción:**
En la vista de proyectos, las columnas de Equipo y Célula estaban mostrando los IDs (UUID) en lugar de los nombres descriptivos, lo que hacía que la interfaz fuera difícil de usar y comprender.

**Pasos para reproducir:**
1. Activar la migración a PostgreSQL para proyectos (`USE_POSTGRES_PROJECTS=true`)
2. Acceder a la página de proyectos

**Impacto:**
La información mostrada era técnicamente correcta pero no útil para los usuarios, ya que mostraba IDs largos y crípticos en lugar de nombres descriptivos.

**Causa raíz:**
El servicio `ProjectPrismaService` estaba devolviendo los IDs de las relaciones (`equipoId` y `celulaId`) en lugar de los nombres de equipo y célula. Esto ocurrió porque en el modelo relacional de Prisma, las relaciones se establecen mediante IDs, mientras que en el formato de archivo JSON, probablemente se almacenaban directamente los nombres.

**Solución:**
Se modificó el método `getAllProjects` en `ProjectPrismaService` para incluir los nombres de equipo y célula en lugar de solo los IDs:

```typescript
equipo: project.team?.name || project.equipoId,
celula: project.cell?.name || project.celulaId,
```

La solución incluye un fallback a los IDs en caso de que los objetos relacionados no estén disponibles.

**Lecciones aprendidas:**
Al migrar de un sistema de almacenamiento basado en archivos a una base de datos relacional, es importante considerar cómo se resolverán las relaciones y cómo se presentarán los datos al usuario final. Es necesario adaptar la capa de servicio para que transforme correctamente los datos del formato de la base de datos al formato esperado por la interfaz de usuario.

### [23/05/2025] - [ProjectPrismaService] - [Estados de proyecto no mostrados]

**Descripción:**
En la vista de proyectos, la columna de "ESTADO" mostraba "Sin estado" para todos los proyectos, aunque en muchos casos se podía inferir el estado del proyecto por otros campos como fechas o plan de trabajo.

**Pasos para reproducir:**
1. Activar la migración a PostgreSQL para proyectos (`USE_POSTGRES_PROJECTS=true`)
2. Acceder a la página de proyectos

**Impacto:**
La información del estado de los proyectos no era visible, lo que dificultaba a los usuarios comprender rápidamente el estatus de los diferentes proyectos.

**Causa raíz:**
El servicio `ProjectPrismaService` estaba devolviendo directamente el valor del campo `estado` de la base de datos, que en muchos casos era nulo. En la versión de archivos, es posible que se calculara el estado automáticamente basado en otros campos o que se estableciera un valor por defecto.

**Solución:**
Se modificó el método `getAllProjects` en `ProjectPrismaService` para incluir lógica de cálculo automático del estado cuando éste no está definido en la base de datos:

```typescript
estado: project.estado || this.calcularEstadoProyecto(project),
estadoCalculado: project.estadoCalculado as any || this.calcularEstadoCalculado(project)
```

Se implementaron dos métodos auxiliares:
1. `calcularEstadoProyecto`: calcula el estado basado en fechas, plan de trabajo y otros campos
2. `calcularEstadoCalculado`: determina el estado calculado entre "Por Iniciar", "En Progreso" y "Certificado"

**Lecciones aprendidas:**
Al migrar a un nuevo sistema de almacenamiento, es importante revisar no solo los datos directos sino también los valores derivados o calculados que pueden haberse manejado de forma diferente en el sistema anterior. Cuando se presenta información a los usuarios, es preferible mostrar valores calculados en lugar de campos nulos o vacíos.

<!-- 
Formato para documentar problemas:

### [FECHA] - [SERVICIO] - [TÍTULO CORTO]

**Descripción:**
Descripción detallada del problema.

**Pasos para reproducir:**
1. Paso 1
2. Paso 2
3. ...

**Impacto:**
Descripción del impacto en usuarios/sistema.

**Causa raíz:**
Análisis de la causa del problema.

**Solución:**
Descripción de la solución implementada.

**Lecciones aprendidas:**
Lecciones para futuros desarrollos.
-->
