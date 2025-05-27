# Integración con SonarQube

Este documento describe cómo configurar y utilizar SonarQube para análisis de código estático en el proyecto Quality Team.

## Requisitos previos

- Docker Desktop instalado y en ejecución
- Node.js y npm instalados
- PowerShell (para Windows) o Terminal (para macOS/Linux)

## Instalación rápida

### Windows

Ejecuta el siguiente comando para configurar completamente SonarQube desde cero:

```bash
setup-sonarqube-completo.bat
```

O usando npm:

```bash
npm run sonar:setup
```

### Configuración manual

1. **Iniciar SonarQube y PostgreSQL**

   ```bash
   npm run sonar:start
   ```

2. **Configurar token de autenticación**

   ```bash
   npm run sonar:token
   ```

3. **Ejecutar análisis de código**

   ```bash
   npm run sonar:compose
   ```

## Arquitectura de la solución

La integración de SonarQube utiliza Docker Compose para gestionar dos contenedores:

- **SonarQube**: El servidor de análisis de código estático
- **PostgreSQL**: La base de datos que almacena los resultados y configuraciones

Los volúmenes de Docker garantizan la persistencia de los datos entre reinicios.

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run sonar:setup` | Configura SonarQube completamente desde cero |
| `npm run sonar:token` | Ayuda a configurar el token de autenticación |
| `npm run sonar:start` | Inicia los contenedores de SonarQube y PostgreSQL |
| `npm run sonar:stop` | Detiene los contenedores |
| `npm run sonar:compose` | Ejecuta un análisis completo (inicia SonarQube si es necesario) |
| `npm run sonar:docker` | Ejecuta análisis usando solo Docker (sin Compose) |
| `npm run sonar:run` | Ejecuta análisis asumiendo que SonarQube ya está en ejecución |

## Acceso a la interfaz web

Una vez iniciado, SonarQube está disponible en:
- **URL**: http://localhost:9000
- **Usuario inicial**: admin
- **Contraseña inicial**: admin

## Estructura de archivos

- `docker-compose-sonar.yml`: Configuración de Docker Compose
- `sonar-project.properties`: Configuración del proyecto para SonarQube
- `scripts/sonar-compose.js`: Script principal de análisis
- `scripts/setup-sonarqube-complete.ps1`: Script de configuración completa
- `scripts/configure-sonar-token.ps1`: Asistente para configurar token
- `setup-sonarqube-completo.bat`: Script de inicio rápido para Windows

## Resolución de problemas

### SonarQube no inicia correctamente

Verifica:
1. Que Docker esté en ejecución
2. Los puertos 9000 no estén siendo utilizados por otros servicios
3. Los logs de Docker: `docker logs quality-team-sonarqube`

### Error de autenticación en el análisis

Asegúrate de:
1. Haber generado un token válido en SonarQube
2. Haberlo configurado correctamente en `sonar-project.properties`
3. O tenerlo disponible como variable de entorno `SONAR_TOKEN`
