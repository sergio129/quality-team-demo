# Script simple para iniciar SonarQube
Write-Host "Iniciando SonarQube" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# Verificar que Docker esté en ejecución
try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker no está en ejecución o no está instalado." -ForegroundColor Red
        Write-Host "Por favor, inicie Docker Desktop e inténtelo nuevamente." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Docker está en ejecución." -ForegroundColor Green
} catch {
    Write-Host "Error al verificar Docker: $_" -ForegroundColor Red
    exit 1
}

# Verificar que exista el archivo docker-compose
$composeFile = Join-Path -Path $PSScriptRoot -ChildPath "..\docker-compose-sonar.yml"
if (-not (Test-Path -Path $composeFile)) {
    # Intentar buscar en la raíz del proyecto
    $composeFile = Join-Path -Path $PSScriptRoot -ChildPath "..\docker-compose-sonar.yml"
    
    if (-not (Test-Path -Path $composeFile)) {
        Write-Host "ERROR: No se encontró el archivo docker-compose-sonar.yml" -ForegroundColor Red
        Write-Host "Asegúrese de que este archivo existe en la raíz del proyecto." -ForegroundColor Yellow
        exit 1
    }
}

# Cambiar al directorio raíz del proyecto
$projectRoot = Split-Path -Parent -Path $PSScriptRoot
Set-Location -Path $projectRoot
Write-Host "Directorio del proyecto: $projectRoot" -ForegroundColor Cyan

# Iniciar los contenedores
Write-Host "Iniciando contenedores de SonarQube..." -ForegroundColor Yellow
docker-compose -f docker-compose-sonar.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al iniciar los contenedores." -ForegroundColor Red
    exit 1
}

Write-Host "Contenedores iniciados correctamente." -ForegroundColor Green
Write-Host ""
Write-Host "INFORMACIÓN DE SONARQUBE:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "URL: http://localhost:9000" -ForegroundColor White
Write-Host "Usuario por defecto: admin" -ForegroundColor White
Write-Host "Contraseña por defecto: admin" -ForegroundColor White
Write-Host ""
Write-Host "SonarQube puede tardar hasta 2 minutos en estar disponible." -ForegroundColor Yellow
Write-Host "Abra http://localhost:9000 en su navegador cuando esté disponible." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para ejecutar el análisis de código:" -ForegroundColor Cyan
Write-Host "  npm run sonar:compose" -ForegroundColor White
