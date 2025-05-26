# Script mejorado para configurar completamente SonarQube desde cero
$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"
$InformationPreference = "Continue"

# Determinar la ruta correcta del proyecto
$scriptPath = $PSCommandPath
$projectRoot = Split-Path -Parent -Path (Split-Path -Parent -Path $scriptPath)
Write-Host "Configurando SonarQube desde cero" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Directorio del proyecto: $projectRoot" -ForegroundColor Cyan

# Verificar si Docker está en ejecución
try {
    Write-Host "`nVerificando que Docker este en ejecucion..." -ForegroundColor Yellow
    
    # Primero verificamos si Docker está instalado
    $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerExists) {
        Write-Host "Docker no esta instalado o no esta en el PATH. Por favor, instala Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Ahora verificamos si está en ejecución
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker esta instalado pero no esta en ejecucion. Por favor, inicia Docker Desktop antes de continuar." -ForegroundColor Red
        Write-Host "En Windows, puedes buscarlo en el menu de inicio o en la bandeja del sistema." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Error al verificar Docker: $_" -ForegroundColor Red
    Write-Host "Asegurate de que Docker Desktop este instalado y en ejecucion." -ForegroundColor Red
    exit 1
}

Write-Host "Docker esta en ejecucion" -ForegroundColor Green

# Verificar que existe el archivo docker-compose.yml
$composeFile = Join-Path -Path $projectRoot -ChildPath "docker-compose-sonar.yml"
if (-not (Test-Path -Path $composeFile)) {
    Write-Host "No se encontro el archivo docker-compose-sonar.yml en $projectRoot" -ForegroundColor Red
    Write-Host "Por favor, asegurate de que el archivo existe y que el script se esta ejecutando desde la carpeta scripts/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Archivo docker-compose-sonar.yml encontrado en: $composeFile" -ForegroundColor Green

# Cambiar al directorio raíz del proyecto
Set-Location -Path $projectRoot
Write-Host "Cambiando al directorio: $projectRoot" -ForegroundColor Cyan

# Detener y eliminar contenedores existentes de SonarQube si existen
Write-Host "`nEliminando contenedores previos si existen..." -ForegroundColor Yellow
# Usar ErrorAction SilentlyContinue para ignorar errores
$ErrorActionPreference = "SilentlyContinue"
docker-compose -f docker-compose-sonar.yml down
docker rm -f quality-team-sonarqube
docker rm -f quality-team-sonar-db
$ErrorActionPreference = "Stop"  # Restaurar el comportamiento normal

# Eliminar volúmenes asociados para comenzar desde cero
Write-Host "`nLimpiando volumenes previos..." -ForegroundColor Yellow
$ErrorActionPreference = "SilentlyContinue"
docker volume rm quality-team_sonarqube_data
docker volume rm quality-team_sonarqube_extensions
docker volume rm quality-team_sonarqube_logs
docker volume rm quality-team_sonar_db_data
$ErrorActionPreference = "Stop"  # Restaurar el comportamiento normal

# Descargar las imágenes requeridas
Write-Host "`nDescargando imagenes de Docker..." -ForegroundColor Yellow
Write-Host "Descargando SonarQube..." -ForegroundColor Cyan
docker pull sonarqube:latest

Write-Host "Descargando PostgreSQL..." -ForegroundColor Cyan
docker pull postgres:13

# Iniciar los contenedores
Write-Host "`nIniciando servicios con Docker Compose..." -ForegroundColor Yellow
Write-Host "Ejecutando desde: $pwd" -ForegroundColor Cyan
Write-Host "Comando: docker-compose -f docker-compose-sonar.yml up -d" -ForegroundColor Cyan

try {
    docker-compose -f docker-compose-sonar.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al iniciar los contenedores con Docker Compose" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Excepcion al iniciar contenedores: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Contenedores iniciados correctamente" -ForegroundColor Green

# Esperar a que SonarQube esté disponible
Write-Host "`nEsperando a que SonarQube este disponible..." -ForegroundColor Yellow
Write-Host "Este proceso puede tardar hasta 2 minutos. Por favor, espere..." -ForegroundColor Yellow

$ready = $false
$attempts = 0
$maxAttempts = 36 # 36 intentos con 5 segundos = 3 minutos máximo

while (-not $ready -and $attempts -lt $maxAttempts) {
    try {
        $result = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -Method Get -ErrorAction SilentlyContinue
        if ($result.Content -match "STARTING") {
            Write-Host "S" -NoNewline -ForegroundColor Yellow  # Indica que está comenzando
        } else {
            $ready = $true
            Write-Host "`nSonarQube esta listo para usar" -ForegroundColor Green
        }
    } catch {
        # Mostrar diferentes caracteres para indicar progreso
        if ($attempts % 4 -eq 0) { Write-Host "." -NoNewline -ForegroundColor Cyan }
        elseif ($attempts % 4 -eq 1) { Write-Host "o" -NoNewline -ForegroundColor Cyan }
        elseif ($attempts % 4 -eq 2) { Write-Host "O" -NoNewline -ForegroundColor Cyan }
        else { Write-Host "o" -NoNewline -ForegroundColor Cyan }
        
        $attempts++
        Start-Sleep -Seconds 5
    }
}

if (-not $ready) {
    Write-Host "`nSonarQube esta tardando mas de lo esperado en iniciar." -ForegroundColor Yellow
    Write-Host "Puede continuar con el analisis, pero verifique manualmente en http://localhost:9000" -ForegroundColor Yellow
}

# Información adicional
Write-Host "`nInformacion de SonarQube:" -ForegroundColor Cyan
Write-Host "1. URL: http://localhost:9000" -ForegroundColor White
Write-Host "2. Usuario por defecto: admin" -ForegroundColor White
Write-Host "3. Contrasena por defecto: admin" -ForegroundColor White
Write-Host "4. Se pedira cambiar la contrasena en el primer inicio de sesion" -ForegroundColor White

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "1. Accede a http://localhost:9000 y configura tu cuenta" -ForegroundColor White
Write-Host "2. Genera un token desde Mi Cuenta > Tokens de seguridad" -ForegroundColor White
Write-Host "3. Ejecuta `"npm run sonar:token`" para configurar el token" -ForegroundColor White
Write-Host "4. Ejecuta el analisis con: npm run sonar:compose" -ForegroundColor White

Write-Host "`nConfiguracion de SonarQube completada" -ForegroundColor Green
