# Cálculo de Calidad en Quality Teams

Este documento explica las diferencias entre los dos métodos de cálculo de calidad que se utilizan en la aplicación Quality Teams.

## 1. Calidad en la Interfaz (86.33%)

La interfaz de usuario utiliza un algoritmo complejo que considera varios factores:

- **Cobertura de ejecución (35%)**: Porcentaje de casos ejecutados vs. diseñados.
- **Efectividad (35%)**: Porcentaje de casos exitosos vs. ejecutados.
- **Densidad de defectos (20%)**: Defectos por caso de prueba.
- **Diversidad de tipos de prueba (10%)**: Variedad de tipos de pruebas utilizados.

**Código de cálculo:**
```typescript
// Ponderación de factores
const weightCoverage = 0.35;     // 35%
const weightEffectiveness = 0.35; // 35%
const weightDefects = 0.20;       // 20%
const weightTestTypes = 0.10;     // 10%

// Cálculo del puntaje final
const qualityScore = (
  (coverageScore * weightCoverage) +
  (effectivenessScore * weightEffectiveness) +
  (defectScore * weightDefects) +
  (testTypeScore * weightTestTypes)
);
```

## 2. Calidad en el PDF (86.33%)

**Actualización:** Ahora el PDF utiliza el mismo algoritmo complejo que la interfaz:

```typescript
// Cálculo del puntaje final usando los mismos factores y ponderaciones
const qualityScore = (
  (coverageScore * weightCoverage) +
  (effectivenessScore * weightEffectiveness) +
  (defectScore * weightDefects) +
  (testTypeScore * weightTestTypes)
);
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
