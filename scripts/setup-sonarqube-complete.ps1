# Script para configurar completamente SonarQube desde cero
Write-Host "🚀 Configurando SonarQube desde cero" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verificar si Docker está en ejecución
try {
    $dockerStatus = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker no está en ejecución. Por favor, inicia Docker Desktop antes de continuar." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker no está instalado o no está accesible. Asegúrate de que Docker Desktop esté instalado." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está en ejecución" -ForegroundColor Green

# Detener y eliminar contenedores existentes de SonarQube si existen
Write-Host "`n👉 Eliminando contenedores previos si existen..." -ForegroundColor Yellow
docker-compose -f docker-compose-sonar.yml down 2>$null
docker rm -f quality-team-sonarqube 2>$null
docker rm -f quality-team-sonar-db 2>$null

# Eliminar volúmenes asociados para comenzar desde cero
Write-Host "`n👉 Limpiando volúmenes previos..." -ForegroundColor Yellow
docker volume rm quality-team_sonarqube_data 2>$null
docker volume rm quality-team_sonarqube_extensions 2>$null
docker volume rm quality-team_sonarqube_logs 2>$null
docker volume rm quality-team_sonar_db_data 2>$null

# Descargar las imágenes requeridas
Write-Host "`n👉 Descargando imágenes de Docker..." -ForegroundColor Yellow
Write-Host "Descargando SonarQube..." -ForegroundColor Cyan
docker pull sonarqube:latest

Write-Host "Descargando PostgreSQL..." -ForegroundColor Cyan
docker pull postgres:13

# Iniciar los contenedores
Write-Host "`n👉 Iniciando servicios con Docker Compose..." -ForegroundColor Yellow
# Asegurar que estamos en el directorio raíz del proyecto
$projectRoot = Split-Path -Parent -Path (Split-Path -Parent -Path $PSCommandPath)
Set-Location -Path $projectRoot
docker-compose -f docker-compose-sonar.yml up -d

# Esperar a que SonarQube esté disponible
Write-Host "`n⏳ Esperando a que SonarQube esté disponible..." -ForegroundColor Yellow
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
            Write-Host "`n✅ SonarQube está listo para usar" -ForegroundColor Green
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
    Write-Host "`n⚠️ SonarQube está tardando más de lo esperado en iniciar." -ForegroundColor Yellow
    Write-Host "Puede continuar con el análisis, pero verifique manualmente en http://localhost:9000" -ForegroundColor Yellow
}

# Información adicional
Write-Host "`n📝 Información de SonarQube:" -ForegroundColor Cyan
Write-Host "1. URL: http://localhost:9000" -ForegroundColor White
Write-Host "2. Usuario por defecto: admin" -ForegroundColor White
Write-Host "3. Contraseña por defecto: admin" -ForegroundColor White
Write-Host "4. Se pedirá cambiar la contraseña en el primer inicio de sesión" -ForegroundColor White

Write-Host "`n🔧 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Accede a http://localhost:9000 y configura tu cuenta" -ForegroundColor White
Write-Host "2. Genera un token desde Mi Cuenta > Tokens de seguridad" -ForegroundColor White
Write-Host "3. Actualiza el token en sonar-project.properties o usa la variable de entorno SONAR_TOKEN" -ForegroundColor White
Write-Host "4. Ejecuta el análisis con: npm run sonar:compose" -ForegroundColor White

Write-Host "`n✅ Configuración de SonarQube completada" -ForegroundColor Green
