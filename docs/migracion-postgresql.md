# Guía de Migración a PostgreSQL

Este documento describe el proceso para migrar los datos de los archivos de texto a una base de datos PostgreSQL.

## Requisitos previos

1. PostgreSQL instalado localmente
2. Base de datos `qualityteams` creada
3. Usuario con permisos para crear tablas y modificar la base de datos

## Estructura de la base de datos

La base de datos está diseñada siguiendo un esquema relacional que refleja las entidades principales del sistema:

- Analistas (QAAnalyst)
- Equipos (Team)
- Células (Cell)
- Planes de prueba (TestPlan)
- Casos de prueba (TestCase)
- Incidentes (Incident)
- Proyectos (Project)

## Pasos de la migración

### 1. Instalación de dependencias

```bash
npm install -D prisma @prisma/client
```

### 2. Configuración de la conexión a PostgreSQL

El archivo `.env` ya contiene la configuración de conexión:

```
DATABASE_URL="postgresql://postgres:0129@localhost:5432/qualityteams?schema=public"
```

### 3. Generación de modelos y cliente Prisma

El esquema Prisma ya está definido en `prisma/schema.prisma`. Para generar el cliente:

```bash
npx prisma generate
```

### 4. Aplicar migraciones

Para crear y aplicar las migraciones:

```bash
npx prisma migrate dev --name init
```

### 5. Migración de datos

Para ejecutar el script de migración de datos:

```bash
node scripts/migrarDatos.js
```

## Verificación

Para verificar que los datos se hayan migrado correctamente:

```bash
node scripts/verificarBD.js
```

## Modificaciones en el código

Las siguientes clases de servicio deben ser actualizadas para utilizar Prisma en lugar de archivos de texto:

- `QAAnalystService`
- `TeamService`
- `CellService`
- `TestPlanService`
- `TestCaseService`
- `IncidentService`
- `ProjectService`

## Consideraciones adicionales

- Durante el periodo de transición, se recomienda mantener ambos sistemas funcionando en paralelo.
- Se deben realizar pruebas exhaustivas para garantizar que la migración no afecte la funcionalidad existente.
- Una vez verificado el funcionamiento correcto, se pueden eliminar los archivos de texto y el código relacionado.

## Modelo de acceso a datos actualizado

Ejemplo de cómo acceder a los datos con Prisma:

```typescript
import { prisma } from '@/lib/prisma';

// Obtener todos los analistas
const analysts = await prisma.qAAnalyst.findMany({
  include: {
    skills: true,
    certifications: true,
    specialties: true,
    cells: {
      include: {
        cell: true
      }
    }
  }
});

// Crear un nuevo analista
const newAnalyst = await prisma.qAAnalyst.create({
  data: {
    name: "Nombre del Analista",
    email: "email@example.com",
    role: "Senior",
    availability: 100,
    skills: {
      create: [
        { name: "Testing", level: "Avanzado" }
      ]
    }
  }
});
```