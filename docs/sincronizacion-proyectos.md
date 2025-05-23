# Sincronización Bidireccional de Proyectos

## Introducción

Este documento describe la solución implementada para la sincronización bidireccional de proyectos entre el archivo `seguimiento.txt` y la base de datos PostgreSQL.

## Problema Anterior

Anteriormente, al crear un nuevo proyecto en el archivo `seguimiento.txt`, éste no se sincronizaba automáticamente con la base de datos, lo que causaba inconsistencias y requería intervención manual.

## Solución Implementada

1. **Script de sincronización de proyectos**: Se ha implementado `syncProjects.ts` que sincroniza todos los proyectos del archivo `seguimiento.txt` a la base de datos PostgreSQL.

2. **Integración con el proceso principal**: Se ha modificado `sincronizarDatos.ts` para incluir la sincronización de proyectos dentro del proceso general de sincronización.

3. **Scripts de ejecución simplificada**: Se han creado scripts batch para facilitar la ejecución:
   - `sync-projects.bat`: Sincroniza específicamente los proyectos
   - `sync-all-data.bat`: Ejecuta la sincronización completa de todos los datos

## Características de la sincronización

- **Detección inteligente**: Evita duplicados al detectar proyectos existentes por ID o nombre
- **Mapeo automático**: Asigna equipos y células incluso cuando no hay coincidencias exactas
- **Manejo de errores**: Proporciona informes detallados sobre el proceso
- **Bidireccionalidad**: Mantiene consistencia entre el archivo y la base de datos

## Cómo usar

Para sincronizar los proyectos después de hacer cambios en `seguimiento.txt`:

1. Ejecuta `sync-projects.bat` para sincronizar solo los proyectos
2. O ejecuta `sync-all-data.bat` para sincronizar todos los datos (analistas, incidentes, casos, planes y proyectos)

## Recomendaciones

- Ejecutar la sincronización completa (`sync-all-data.bat`) después de realizar cambios importantes en cualquier archivo de datos
- Ejecutar la sincronización de proyectos (`sync-projects.bat`) después de agregar o modificar proyectos en `seguimiento.txt`
- Verificar periódicamente la consistencia entre los archivos y la base de datos

## Archivos modificados

- `scripts/syncProjects.ts`: Implementación de la sincronización de proyectos
- `scripts/sincronizarDatos.ts`: Integración de la sincronización de proyectos
- `sync-projects.bat`: Script para ejecutar solo la sincronización de proyectos
- `sync-all-data.bat`: Script para ejecutar la sincronización completa
