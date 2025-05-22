# Cálculo de Calidad en Quality Teams

Este documento explica el método de cálculo de calidad utilizado en la aplicación Quality Teams.

## Nuevo método de cálculo de calidad (Mayo 2025)

Actualmente, la calidad de los planes de prueba se calcula mediante una fórmula simple y directa que se enfoca específicamente en la relación entre defectos encontrados y casos diseñados:

```
Calidad = 100 - (totalDefectos / totalCasosDisenados) * 100
```

Esta fórmula produce los siguientes resultados:

- Cuando no hay defectos, la calidad es del 100%
- Cuanto mayor sea el número de defectos en relación con los casos de prueba, menor será la calidad
- Si hay más defectos que casos de prueba (lo que puede ocurrir si un caso tiene múltiples defectos), se establece un mínimo de 0%

### Ejemplos:

1. Un plan con 10 casos y 0 defectos: 100 - (0/10)*100 = **100%**
2. Un plan con 5 casos y 1 defecto: 100 - (1/5)*100 = **80%**
3. Un plan con 4 casos y 3 defectos: 100 - (3/4)*100 = **25%**

### Implementación técnica:

```typescript
// Contar el total de defectos
const totalDefects = casesToEvaluate.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
const totalCasosDisenados = casesToEvaluate.length;

// Si no hay defectos, la calidad es 100%
if (totalDefects === 0) {
  return 100;
}

// Aplicar la fórmula: Calidad = 100 - (totalDefectos / totalCasosDisenados) * 100
const qualityScore = 100 - (totalDefects / totalCasosDisenados) * 100;

// Asegurarse de que la calidad no sea un número negativo
const finalScore = Math.max(0, qualityScore);
```

Para SRCA-6556:
- Casos: 3
- Casos exitosos: 2
- Casos fallidos: 1
- Defectos: 1
- Tipos de prueba: 1 o más

## Consistencia entre interfaz y PDF

Hemos unificado ambos métodos de cálculo para asegurar la consistencia:

1. Tanto la interfaz como el PDF usan ahora el mismo algoritmo completo.
2. Los resultados serán idénticos en ambas visualizaciones.
3. Los factores ponderados proporcionan una medición más precisa de la calidad real.

## Notas adicionales

El algoritmo unificado proporciona una medida más holística de la calidad, considerando no solo los defectos sino también la cobertura de ejecución y la diversidad de tipos de prueba.
