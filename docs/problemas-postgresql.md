# Problemas Detectados - Migración a PostgreSQL

Este documento registra los problemas encontrados durante la migración a PostgreSQL y sus soluciones.

## Tabla de problemas

| Fecha | Servicio | Problema | Solución | Estado |
|-------|----------|----------|----------|--------|
| 23/05/2025 | TestCaseService | Error "fs is not defined" en los métodos getAllTestCases y getAllTestPlans | Implementación correcta del patrón adaptador para separar servicios de casos y planes | Resuelto |
| 23/05/2025 | TeamPrismaService | Error "Unknown field `members` for include statement on model `Team`" | Corrección en las consultas para usar el campo 'analysts' en lugar de 'members' | Resuelto |
| 23/05/2025 | ProjectPrismaService | Error de mapeo de campos entre el modelo Project y el esquema Prisma | Corrección del mapeo de campos en el servicio | Resuelto |

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

### [23/05/2025] - [ProjectPrismaService] - [Error de mapeo en el servicio de proyectos]

**Descripción:**
El servicio de proyectos (`ProjectPrismaService`) no mapeaba correctamente los campos entre el modelo de la aplicación (`Project`) y el esquema de Prisma, lo que causaba que la lista de proyectos apareciera vacía.

**Pasos para reproducir:**
1. Activar la migración a PostgreSQL para proyectos (`USE_POSTGRES_PROJECTS=true`)
2. Acceder a la página de proyectos

**Impacto:**
Los proyectos no se mostraban en la interfaz de usuario, apareciendo un mensaje de "No hay proyectos que coincidan con los criterios de búsqueda".

**Causa raíz:**
Había discrepancias entre los nombres de campos en el modelo `Project` de la aplicación y el esquema de Prisma. Por ejemplo, en el esquema de Prisma los campos `equipoId` y `celulaId` se usan como claves foráneas, mientras que en la aplicación se esperan campos llamados `equipo` y `celula`.

**Solución:**
Se modificó el servicio `ProjectPrismaService` para mapear correctamente los campos entre el esquema de Prisma y el modelo de la aplicación. Se corrigieron las consultas para incluir relaciones correctamente y se ajustaron los nombres de los campos para que coincidieran con lo esperado por la aplicación.

**Lecciones aprendidas:**
Es crucial asegurar que los adaptadores de servicio realicen un mapeo correcto entre el modelo de datos de la ORM y el modelo de datos esperado por la aplicación. El diseño de esquemas de base de datos sigue diferentes convenios que los modelos de objetos en la aplicación, por lo que los adaptadores deben conciliar estas diferencias.

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
