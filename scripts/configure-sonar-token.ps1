# Script para ayudar a generar un token de SonarQube
Write-Host "🔑 Asistente para configurar token de SonarQube" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Verificar si SonarQube está en ejecución
Write-Host "`n👉 Verificando si SonarQube está en ejecución..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -Method Get -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SonarQube está en ejecución" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ SonarQube no está disponible en http://localhost:9000" -ForegroundColor Red
    Write-Host "Por favor, ejecuta primero setup-sonarqube-complete.ps1 para iniciar SonarQube" -ForegroundColor Yellow
    exit 1
}

# Mostrar instrucciones para generar un token
Write-Host "`n📝 Sigue estos pasos para generar un token en SonarQube:" -ForegroundColor Cyan
Write-Host "1. Abre http://localhost:9000 en tu navegador" -ForegroundColor White
Write-Host "2. Inicia sesión con las credenciales (por defecto admin/admin)" -ForegroundColor White
Write-Host "3. Ve a tu perfil (icono de usuario en la esquina superior derecha)" -ForegroundColor White
Write-Host "4. Selecciona 'Mi Cuenta'" -ForegroundColor White
Write-Host "5. Ve a la pestaña 'Tokens de seguridad'" -ForegroundColor White
Write-Host "6. Dale un nombre al token (ej: 'quality-team-token')" -ForegroundColor White
Write-Host "7. Haz clic en 'Generar'" -ForegroundColor White
Write-Host "8. IMPORTANTE: Copia el token generado" -ForegroundColor Red

Write-Host "`nUna vez que tengas el token, puedes:" -ForegroundColor Yellow
Write-Host "A. Guardarlo como variable de entorno (recomendado):" -ForegroundColor White
Write-Host "   \$env:SONAR_TOKEN = \"tu-token-generado\"" -ForegroundColor White
Write-Host "   (Esta variable se perderá cuando cierres PowerShell)" -ForegroundColor Gray
Write-Host "   Para hacerla permanente: [Environment]::SetEnvironmentVariable(\"SONAR_TOKEN\", \"tu-token\", \"User\")" -ForegroundColor Gray

Write-Host "`nB. Actualizarlo en el archivo sonar-project.properties:" -ForegroundColor White
Write-Host "   sonar.login=tu-token-generado" -ForegroundColor White

# Preguntar si quiere actualizar el token ahora
$updateFile = Read-Host "`n¿Quieres actualizar el token en sonar-project.properties ahora? (s/n)"
if ($updateFile -eq "s" -or $updateFile -eq "S") {
    $tokenValue = Read-Host "Ingresa el token generado" -AsSecureString
    
    # Convertir SecureString a texto plano
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenValue)
    $tokenPlainText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Leer el archivo original
    $filePath = "..\sonar-project.properties"
    $content = Get-Content -Path $filePath -Raw
    
    # Reemplazar la línea del token
    $newContent = $content -replace "sonar\.login=.*", "sonar.login=$tokenPlainText"
    
    # Guardar el archivo
    $newContent | Set-Content -Path $filePath
    
    Write-Host "`n✅ Token actualizado en sonar-project.properties" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ No se ha actualizado el token en sonar-project.properties" -ForegroundColor Yellow
    Write-Host "Recuerda actualizar el token antes de ejecutar el análisis" -ForegroundColor Yellow
}

Write-Host "`n🚀 Para ejecutar el análisis, usa:" -ForegroundColor Cyan
Write-Host "npm run sonar:compose" -ForegroundColor White
