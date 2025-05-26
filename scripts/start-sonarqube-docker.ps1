# Script para iniciar SonarQube con Docker y ejecutar análisis
# Autor: GitHub Copilot
# Fecha: 26 de mayo de 2025

Write-Host "🚀 Iniciando SonarQube con Docker" -ForegroundColor Cyan

# Comprobar si Docker está funcionando
try {
    $dockerStatus = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker no está en funcionamiento. Por favor, inicie Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker no parece estar instalado o accesible. Verifique la instalación de Docker." -ForegroundColor Red
    exit 1
}

# Comprobar si el contenedor sonarqube ya está ejecutándose
$containerRunning = docker ps -q -f name=sonarqube
if (-not $containerRunning) {
    # Verificar si existe un contenedor detenido
    $stoppedContainer = docker ps -aq -f name=sonarqube
    if ($stoppedContainer) {
        Write-Host "🔄 Eliminando contenedor sonarqube existente..." -ForegroundColor Yellow
        docker rm -f sonarqube
    }
    
    Write-Host "🐳 Iniciando contenedor de SonarQube..." -ForegroundColor Cyan
    docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
    
    Write-Host "⏳ Esperando a que SonarQube esté disponible (esto puede tardar hasta 2 minutos)..." -ForegroundColor Yellow
    
    $ready = $false
    $attempts = 0
    $maxAttempts = 24  # 24 intentos * 5 segundos = 2 minutos máximo
    
    while (-not $ready -and $attempts -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
                Write-Host "`n✅ SonarQube está listo para usar" -ForegroundColor Green
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Yellow
            $attempts++
            Start-Sleep -Seconds 5
        }
    }
    
    if (-not $ready) {
        Write-Host "`n❌ SonarQube no respondió en el tiempo esperado." -ForegroundColor Red
        Write-Host "Por favor, verifique manualmente el estado accediendo a http://localhost:9000" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "`n📝 Información importante:" -ForegroundColor Cyan
    Write-Host "1. El usuario predeterminado es 'admin' y la contraseña es 'admin'" -ForegroundColor White
    Write-Host "2. Se le pedirá cambiar la contraseña en el primer inicio de sesión" -ForegroundColor White
    Write-Host "3. Acceda a http://localhost:9000 para ver la interfaz web de SonarQube" -ForegroundColor White
    Write-Host "4. Para generar un token, vaya a su cuenta > Mi Cuenta > Tokens de seguridad" -ForegroundColor White
} else {
    Write-Host "✅ El contenedor SonarQube ya está en ejecución" -ForegroundColor Green
}

# Ejecutar el análisis
Write-Host "`n🔍 Ejecutando análisis del código fuente..." -ForegroundColor Cyan
Write-Host "Ejecutando: npm run sonar:run" -ForegroundColor White
npm run sonar:run

Write-Host "`n✅ Proceso completado. Revise los resultados en http://localhost:9000" -ForegroundColor Green
