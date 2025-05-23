# Lista de verificación para la migración a PostgreSQL

Este documento contiene una lista de puntos a verificar durante la semana de monitoreo del sistema con todos los servicios activados en PostgreSQL.

## Verificaciones diarias

### Funcionamiento general
- [x] La aplicación inicia correctamente
- [x] La navegación entre páginas funciona sin errores
- [x] No hay errores visibles en la interfaz de usuario

### Verificaciones por servicio

#### QAAnalystService
- [x] Lista de analistas se carga correctamente
- [ ] Creación de nuevos analistas funciona
- [ ] Edición de analistas existentes funciona
- [ ] Eliminación de analistas funciona
- [ ] Asignación de analistas a células funciona

#### TeamService
- [x] Lista de equipos se carga correctamente
- [ ] Creación de nuevos equipos funciona
- [ ] Edición de equipos existentes funciona
- [ ] Eliminación de equipos funciona
- [ ] Asignación de miembros a equipos funciona

#### CellService
- [x] Lista de células se carga correctamente
- [ ] Creación de nuevas células funciona
- [ ] Edición de células existentes funciona
- [ ] Eliminación de células funciona
- [ ] Relación entre células y equipos funciona

#### TestCaseService
- [ ] Lista de casos de prueba se carga correctamente
- [ ] Creación de nuevos casos de prueba funciona
- [ ] Edición de casos de prueba existentes funciona
- [ ] Eliminación de casos de prueba funciona
- [ ] Gestión de pasos de casos de prueba funciona
- [ ] Relación con planes de prueba funciona

#### TestPlanService
- [ ] Lista de planes de prueba se carga correctamente
- [ ] Creación de nuevos planes de prueba funciona
- [ ] Edición de planes de prueba existentes funciona
- [ ] Eliminación de planes de prueba funciona
- [ ] Gestión de ciclos de prueba funciona

#### IncidentService
- [ ] Lista de incidentes se carga correctamente
- [ ] Creación de nuevos incidentes funciona
- [ ] Edición de incidentes existentes funciona
- [ ] Eliminación de incidentes funciona
- [ ] Relación con casos de prueba funciona
- [ ] Relación con analistas funciona

#### ProjectService
- [x] Lista de proyectos se carga correctamente
- [ ] Creación de nuevos proyectos funciona
- [ ] Edición de proyectos existentes funciona
- [ ] Eliminación de proyectos funciona
- [ ] Relaciones con casos de prueba, planes e incidentes funcionan

## Verificaciones de rendimiento
- [ ] Tiempos de carga de listas son aceptables (< 2 segundos)
- [ ] Operaciones CRUD se completan en tiempo razonable (< 1 segundo)
- [ ] No hay degradación de rendimiento con el tiempo

## Verificaciones de errores
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs del servidor
- [ ] El mecanismo de fallback funciona si se desconecta la base de datos

## Verificaciones de consistencia
- [ ] Los datos creados con PostgreSQL son correctos
- [ ] Las relaciones entre entidades se mantienen
- [ ] No hay duplicación de datos

## Instrucciones para documentar problemas
Si se encuentra algún problema durante la verificación, documente:
1. **Fecha y hora** del problema
2. **Servicio** afectado
3. **Descripción detallada** del problema
4. **Pasos para reproducir** el problema
5. **Capturas de pantalla** o logs relevantes
6. **Impacto** en los usuarios o sistema

Documentar todos los problemas en el archivo `docs/problemas-postgresql.md` siguiendo el formato establecido.
