# Manejo de Fechas en Planes de Prueba

Este documento explica cómo la aplicación Quality Team maneja las fechas en los planes de prueba.

## Formato de Fechas

Para evitar problemas con zonas horarias y garantizar la consistencia, todas las fechas en los planes de prueba se almacenan en formato ISO 8601 sin la parte de tiempo (`YYYY-MM-DD`).

## Creación de Planes

Cuando se crea un plan de prueba, el sistema:

1. Usa la fecha actual como fecha de inicio por defecto
2. Si se selecciona un proyecto existente, usa la fecha de entrega del proyecto como fecha de fin
3. Calcula los días estimados entre la fecha actual y la fecha de fin (si existe)
4. Calcula automáticamente las horas basadas en los días (9 horas por día laborable)

## Cálculo de Días y Horas

La aplicación utiliza las siguientes fórmulas para la conversión entre días y horas:

- 1 día = 9 horas de trabajo
- Para convertir horas a días: `días = horas / 9`
- Para convertir días a horas: `horas = días * 9`

El sistema redondea los resultados para evitar valores con muchos decimales:
- Días: redondeados a 1 decimal (ej: 1.5 días)
- Horas: redondeadas a números enteros

## Visualización de Fechas

Las fechas siempre se muestran en formato `DD/MM/YYYY` en la interfaz de usuario para facilitar la lectura.

## Mejoras Implementadas (Mayo 2025)

Se han realizado las siguientes mejoras para solucionar problemas conocidos:

1. Corrección del formato de fechas para evitar el problema de "día anterior" causado por ajustes de zona horaria
2. Estandarización del cálculo días/horas usando 9 horas como valor constante
3. Mejora en la creación automática de planes al crear un proyecto para usar correctamente las fechas
4. Validación y limpieza de fechas para garantizar el formato YYYY-MM-DD
