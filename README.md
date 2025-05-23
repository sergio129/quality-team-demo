# Quality Teams

Sistema de gestión de calidad para equipos de pruebas de software.

## Características principales

- Gestión de proyectos y planes de prueba
- Seguimiento de casos de prueba
- Cálculo de métricas de calidad
- Exportación a Excel y PDF
- Gestión de equipos y analistas

## Migración a PostgreSQL

El sistema está en proceso de migración desde almacenamiento basado en archivos a PostgreSQL. Para controlar esta migración:

1. Configura las variables en el archivo `.env`:
   ```
   # Activar PostgreSQL globalmente
   USE_POSTGRES=true
   
   # O activar para servicios específicos
   USE_POSTGRES_ANALYSTS=true
   USE_POSTGRES_TEAMS=true
   # etc.
   ```

2. Verifica la consistencia de datos:
   ```bash
   npx ts-node scripts/verificarMigracion.ts
   ```

3. Migra datos desde archivos:
   ```bash
   npx ts-node scripts/migrarDatos.js
   ```

4. Sincroniza datos (PostgreSQL -> Archivos):
   ```bash
   npx ts-node scripts/sincronizarDatos.ts
   ```

Para más detalles, consulta [Estado de la migración](docs/estado-migracion.md) y [Estrategia de migración](docs/estrategia-migracion-incremental.md).

## Cálculo de Calidad

El sistema utiliza dos métodos diferentes para calcular la calidad:

### Interfaz (86.33%)
Método complejo con 4 factores ponderados:
- Cobertura de ejecución (35%)
- Efectividad (35%) 
- Densidad de defectos (20%)
- Diversidad de tipos de prueba (10%)

### PDF (67%)
Método simplificado basado solo en defectos:
```
Calidad = 100 - (totalDefectos / totalCasosDisenados) * 100
```

Para más detalles, vea el documento completo en [docs/calculo-calidad.md](docs/calculo-calidad.md).

## Base de Datos

### Migración a PostgreSQL

El sistema ahora soporta dos tipos de almacenamiento:

1. **Archivos de texto** (método original)
2. **PostgreSQL** (nuevo método)

Para ejecutar la aplicación con PostgreSQL:

```bash
$env:USE_POSTGRES="true"; npm run dev
```

O para habilitar servicios específicos con PostgreSQL:

```bash
$env:USE_POSTGRES_ANALYSTS="true"; $env:USE_POSTGRES_CELLS="true"; npm run dev
```

Para más detalles sobre la migración, consulte:
- [docs/migracion-postgresql.md](docs/migracion-postgresql.md)
- [docs/estrategia-migracion-incremental.md](docs/estrategia-migracion-incremental.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
