# Script para verificar el estado de SonarQube
Write-Host "Verificando estado de SonarQube" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Verificar contenedores
try {
    $sonarContainer = docker ps -f "name=quality-team-sonarqube" --format "{{.Status}}"
    $dbContainer = docker ps -f "name=quality-team-sonar-db" --format "{{.Status}}"
    
    if ($sonarContainer) {
        Write-Host "✓ Contenedor SonarQube: EN EJECUCIÓN" -ForegroundColor Green
        Write-Host "  Estado: $sonarContainer" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Contenedor SonarQube: NO ESTÁ EN EJECUCIÓN" -ForegroundColor Red
        
        # Verificar si existe pero está detenido
        $stoppedSonar = docker ps -a -f "name=quality-team-sonarqube" --format "{{.Status}}"
        if ($stoppedSonar) {
            Write-Host "  Estado: $stoppedSonar (detenido)" -ForegroundColor Yellow
        }
    }
    
    if ($dbContainer) {
        Write-Host "✓ Contenedor PostgreSQL: EN EJECUCIÓN" -ForegroundColor Green
        Write-Host "  Estado: $dbContainer" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Contenedor PostgreSQL: NO ESTÁ EN EJECUCIÓN" -ForegroundColor Red
        
        # Verificar si existe pero está detenido
        $stoppedDB = docker ps -a -f "name=quality-team-sonar-db" --format "{{.Status}}"
        if ($stoppedDB) {
            Write-Host "  Estado: $stoppedDB (detenido)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Error al verificar contenedores: $_" -ForegroundColor Red
}

# Verificar servicio web de SonarQube
try {
    Write-Host "`nVerificando si el servicio web de SonarQube está respondiendo..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "http://localhost:9000" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Servicio web de SonarQube: DISPONIBLE" -ForegroundColor Green
        
        # Intentar verificar estado del sistema
        try {
            $statusResponse = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
            $statusJson = $statusResponse.Content | ConvertFrom-Json
            Write-Host "  Estado del sistema: $($statusJson.status)" -ForegroundColor Cyan
            Write-Host "  Versión: $($statusJson.version)" -ForegroundColor Cyan
        } catch {
            Write-Host "  No se pudo obtener información detallada del estado" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "✗ Servicio web de SonarQube: NO DISPONIBLE" -ForegroundColor Red
    Write-Host "  El servicio web aún no responde o no está en ejecución" -ForegroundColor Red
}

# Verificar volúmenes utilizados
try {
    Write-Host "`nVerificando volúmenes de datos..."  -ForegroundColor Yellow
    
    $volumes = docker volume ls -f "name=quality-team_sonarqube_" --format "{{.Name}}"
    if ($volumes) {
        Write-Host "✓ Volúmenes de SonarQube: ENCONTRADOS" -ForegroundColor Green
        $volumesArray = $volumes -split "`n"
        foreach ($volume in $volumesArray) {
            Write-Host "  $volume" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ Volúmenes de SonarQube: NO ENCONTRADOS" -ForegroundColor Red
    }
} catch {
    Write-Host "Error al verificar volúmenes: $_" -ForegroundColor Red
}

# Verificar token en sonar-project.properties
try {
    Write-Host "`nVerificando configuración de token..."  -ForegroundColor Yellow
    
    $projectRoot = Split-Path -Parent -Path $PSScriptRoot
    $sonarPropertiesPath = Join-Path -Path $projectRoot -ChildPath "sonar-project.properties"
    
    if (Test-Path -Path $sonarPropertiesPath) {
        $sonarConfig = Get-Content -Path $sonarPropertiesPath -Raw
        
        if ($sonarConfig -match "sonar\.login=([^\r\n]+)") {
            $token = $matches[1]
            if ($token -and $token -ne "TU_TOKEN_GENERADO" -and $token -ne "tu-token-generado-aqui") {
                Write-Host "✓ Token configurado: PRESENTE" -ForegroundColor Green
                $maskedToken = $token.Substring(0, 5) + "..." + $token.Substring($token.Length - 5)
                Write-Host "  Token: $maskedToken (parcialmente oculto)" -ForegroundColor Cyan
            } else {
                Write-Host "✗ Token configurado: VALOR POR DEFECTO" -ForegroundColor Red
                Write-Host "  Debe configurar un token válido en sonar-project.properties" -ForegroundColor Red
            }
        } else {
            # Verificar si está comentado
            if ($sonarConfig -match "#\s*sonar\.login=") {
                Write-Host "✗ Token configurado: COMENTADO" -ForegroundColor Red
                Write-Host "  Quite el comentario y configure un token válido" -ForegroundColor Red
            } else {
                Write-Host "✗ Token configurado: NO ENCONTRADO" -ForegroundColor Red
                Write-Host "  Añada la propiedad sonar.login con su token" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✗ Archivo sonar-project.properties no encontrado" -ForegroundColor Red
    }
} catch {
    Write-Host "Error al verificar token: $_" -ForegroundColor Red
}

# Mostrar comandos útiles
Write-Host "`nCOMANDOS ÚTILES:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Iniciar SonarQube (preservando datos):  npm run sonar:preserve" -ForegroundColor White
Write-Host "Ejecutar análisis:                      npm run sonar:compose" -ForegroundColor White
Write-Host "Detener contenedores:                   npm run sonar:stop" -ForegroundColor White
Write-Host "Ver dashboard en navegador:             http://localhost:9000/dashboard?id=quality-team" -ForegroundColor White
