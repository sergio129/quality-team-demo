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

## 2. Calidad en el PDF (67%)

El PDF utiliza un cálculo más simple basado únicamente en defectos:

```typescript
// Calculamos la calidad como 100% menos el porcentaje de defectos sobre casos diseñados
calidad = 100 - (totalDefectos / totalCasosDisenados) * 100;
```

Para SRCA-6556:
- Casos: 3
- Defectos: 1
- Cálculo: 100 - (1/3)*100 = 66.67%, que redondeado es 67%

## ¿Por qué hay diferencia?

La diferencia se debe a que:

1. La interfaz usa un algoritmo más completo que considera múltiples factores.
2. El PDF usa una fórmula simplificada que solo considera defectos.
3. Los diferentes pesos y factores llevan a resultados distintos.

## Recomendaciones

Se recomienda unificar los métodos de cálculo para evitar confusiones, o clarificar en la interfaz qué está midiendo cada método.
