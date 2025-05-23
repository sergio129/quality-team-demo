# Plan de adaptación para la verificación de migración

## Estado actual

Hemos identificado las siguientes diferencias entre las implementaciones de archivos y PostgreSQL:

### Diferencias estructurales:

1. **Formatos de fecha**: 
   - Las fechas se almacenan como strings ISO en archivos
   - Las fechas se almacenan como objetos Date en PostgreSQL
   - Al compararse, pueden parecer diferentes aunque representen el mismo momento

2. **Referencias a entidades relacionadas**:
   - En archivos: Se usan nombres o strings para referencias (ej: "Sergio Anaya", "KCRM")
   - En PostgreSQL: Se usan UUIDs (ej: "18cec5e1-b822-491a-86af-c22264f0e307")

3. **Valores por defecto**:
   - En algunos casos, los valores por defecto difieren entre implementaciones
   - Ejemplo: idJira vacío en PostgreSQL vs BCGT-1033 en archivos

## Propuesta para el script de verificación

El script de verificación debe modificarse para:

1. **Normalizar fechas antes de comparar**:
   - Convertir ambas representaciones a un formato común (ej: timestamp)
   - Ignorar diferencias de milisegundos

2. **Manejar referencias relacionales**:
   - Realizar un mapeo de IDs a nombres para comparaciones
   - Considerar equivalentes las referencias que apuntan a la misma entidad

3. **Ignorar campos específicos**:
   - Excluir campos no esenciales de la comparación
   - Agregar una lista configurable de campos a ignorar

## Implementación recomendada

```javascript
function compareDataSets(fileData, prismaData, options = {}) {
  const {
    keyField = 'id',
    ignoreFields = [], 
    relationshipFields = {},
    dateFields = []
  } = options;
  
  // ... lógica de comparación existente
  
  // Al comparar campos:
  Object.keys(fileItem).forEach(key => {
    // Ignorar campos específicos
    if (ignoreFields.includes(key)) return;
    
    // Manejar campos de fecha
    if (dateFields.includes(key)) {
      // Comparar fechas por timestamp
      const fileDate = new Date(fileItem[key]).getTime();
      const prismaDate = new Date(prismaItem[key]).getTime();
      if (Math.abs(fileDate - prismaDate) > 1000) { // permitir diferencia de 1 segundo
        differences[key] = {
          file: fileItem[key],
          prisma: prismaItem[key]
        };
        hasDifferences = true;
      }
      return;
    }
    
    // Manejar campos relacionales
    if (relationshipFields[key]) {
      // Comparar por nombre o ID según mapeo
      // Implementación específica...
      return;
    }
    
    // Comparación normal para otros campos
    if (typeof fileItem[key] !== 'object' && fileItem[key] !== prismaItem[key]) {
      differences[key] = {
        file: fileItem[key],
        prisma: prismaItem[key]
      };
      hasDifferences = true;
    }
  });
}
```

## Próximos pasos

1. Implementar el script de verificación mejorado
2. Realizar pruebas de verificación con los datos actuales
3. Activar los servicios restantes en PostgreSQL gradualmente
4. Monitorear el comportamiento del sistema
