# Script para iniciar o reutilizar SonarQube
Write-Host "Iniciando o reutilizando SonarQube" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

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

# Verificar si ya existen contenedores de SonarQube en ejecución
$sonarRunning = $false
try {
    $sonarContainer = docker ps -q -f "name=quality-team-sonarqube"
    if ($sonarContainer) {
        Write-Host "SonarQube ya está en ejecución." -ForegroundColor Green
        Write-Host "Contenedor ID: $sonarContainer" -ForegroundColor Cyan
        $sonarRunning = $true
    } else {
        Write-Host "SonarQube no está en ejecución actualmente." -ForegroundColor Yellow
        
        # Verificar si existe el contenedor pero está detenido
        $stoppedContainer = docker ps -aq -f "name=quality-team-sonarqube"
        if ($stoppedContainer) {
            Write-Host "Encontrado contenedor SonarQube detenido. Iniciándolo..." -ForegroundColor Yellow
            docker start $stoppedContainer
            Write-Host "Contenedor SonarQube iniciado." -ForegroundColor Green
            $sonarRunning = $true
        }
    }
} catch {
    Write-Host "Error al verificar el estado de los contenedores: $_" -ForegroundColor Red
}

# Si no está en ejecución, verificar el docker-compose
if (-not $sonarRunning) {
    # Verificar que exista el archivo docker-compose
    $projectRoot = Split-Path -Parent -Path $PSScriptRoot
    $composeFile = Join-Path -Path $projectRoot -ChildPath "docker-compose-sonar.yml"
    
    if (-not (Test-Path -Path $composeFile)) {
        Write-Host "ERROR: No se encontró el archivo docker-compose-sonar.yml" -ForegroundColor Red
        Write-Host "Asegúrese de que este archivo existe en la raíz del proyecto." -ForegroundColor Yellow
        exit 1
    }
    
    # Cambiar al directorio raíz del proyecto
    Set-Location -Path $projectRoot
    
    # Iniciar los contenedores preservando datos
    Write-Host "Iniciando contenedores de SonarQube con Docker Compose..." -ForegroundColor Yellow
    Write-Host "Se preservarán todos los análisis previos." -ForegroundColor Green
    
    docker-compose -f docker-compose-sonar.yml up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al iniciar los contenedores." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Contenedores iniciados correctamente." -ForegroundColor Green
}

# Verificar que SonarQube esté respondiendo
Write-Host "Verificando conexión con SonarQube..." -ForegroundColor Yellow

$ready = $false
$attempts = 0
$maxAttempts = 12 # 12 intentos con 5 segundos = 1 minuto máximo

while (-not $ready -and $attempts -lt $maxAttempts) {
    try {
        $result = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($result.StatusCode -eq 200) {
            $ready = $true
            Write-Host "SonarQube está respondiendo correctamente." -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        $attempts++
        Start-Sleep -Seconds 5
    }
}

if (-not $ready) {
    Write-Host "`nADVERTENCIA: SonarQube aún no responde. Puede tardar unos minutos más en estar disponible." -ForegroundColor Yellow
} else {
    # Verificar si ya existe un proyecto con el mismo nombre
    try {
        $projectKey = "quality-team" # Debe coincidir con sonar.projectKey en sonar-project.properties
        $projectResult = Invoke-WebRequest -Uri "http://localhost:9000/api/components/show?component=$projectKey" -Method Get -ErrorAction SilentlyContinue
        
        if ($projectResult.StatusCode -eq 200) {
            Write-Host "✅ Proyecto 'quality-team' ya existe en SonarQube." -ForegroundColor Green
            Write-Host "Los nuevos análisis se agregarán al historial existente." -ForegroundColor Green
        }
    } catch {
        Write-Host "El proyecto '$projectKey' no existe aún en SonarQube." -ForegroundColor Yellow
        Write-Host "Se creará automáticamente en el primer análisis." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "INFORMACIÓN DE SONARQUBE:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "URL: http://localhost:9000" -ForegroundColor White
Write-Host "Token configurado: ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Para ejecutar un nuevo análisis:" -ForegroundColor Cyan
Write-Host "  npm run sonar:compose" -ForegroundColor White
Write-Host ""
Write-Host "Para ver los resultados del análisis:" -ForegroundColor Cyan
Write-Host "  http://localhost:9000/dashboard?id=quality-team" -ForegroundColor White
