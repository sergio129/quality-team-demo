# Componente de Importación y Generación con IA para Casos de Prueba

Este componente permite importar casos de prueba desde archivos Excel y también generar casos de prueba automáticamente utilizando IA a partir de requisitos extraídos de Excel.

## Características

1. **Importación de casos de prueba desde Excel**
   - Carga de archivos Excel con casos de prueba predefinidos
   - Mapeo automático de columnas a atributos del modelo TestCase
   - Guardado directo en la base de datos

2. **Generación de casos de prueba con IA**
   - Extracción de requisitos desde formatos Excel variados
   - Procesamiento inteligente de criterios de aceptación
   - Generación automática con GPT-4
   - Vista previa y edición de casos generados
   - Guardado en base de datos o descarga como Excel

3. **Integración con planes de prueba**
   - Asociación automática de casos con planes seleccionados
   - Inclusión de información contextual para mejorar la generación

## Formatos de Excel soportados

El componente acepta dos formatos principales de Excel:

### 1. Excel con casos de prueba predefinidos
- Requiere columnas: HU, ID, Nombre del caso de prueba, Pasos, Resultado esperado, etc.
- Ejemplo en la plantilla estándar

### 2. Excel con requisitos para generación con IA
- Requiere al menos: ID Historia, Nombre del Requerimiento, Descripción
- Opcionalmente: Criterios de Aceptación, Descripción Funcional
- Ejemplo en la plantilla de requerimientos

## Flujo de trabajo recomendado

1. Seleccionar proyecto y plan de pruebas
2. Cargar archivo Excel con requisitos
3. Generar casos de prueba con IA
4. Revisar y editar casos en la vista previa
5. Guardar casos en la base de datos o descargar como Excel

## Mejoras implementadas

- Detección automática de formatos variados de Excel
- Procesamiento avanzado de criterios de aceptación
- Vista previa y edición de casos generados antes de guardar
- Mejor integración con planes de prueba
- Optimización del prompt para la IA
- Parser mejorado para la respuesta de la IA
