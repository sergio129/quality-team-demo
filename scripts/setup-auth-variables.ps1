# setup-auth-variables.ps1
# Script para configurar variables de entorno para NextAuth

Write-Host "Configurando variables de entorno para NextAuth..." -ForegroundColor Green

# Generar un secret seguro para NEXTAUTH_SECRET si no existe
if (-not [System.Environment]::GetEnvironmentVariable("NEXTAUTH_SECRET", "User")) {
    $randomBytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($randomBytes)
    $secret = [Convert]::ToBase64String($randomBytes)
    
    [System.Environment]::SetEnvironmentVariable("NEXTAUTH_SECRET", $secret, "User")
    Write-Host "NEXTAUTH_SECRET generado y establecido" -ForegroundColor Green
}
else {
    Write-Host "NEXTAUTH_SECRET ya está configurado" -ForegroundColor Yellow
}

# Establecer NEXTAUTH_URL para desarrollo local
if (-not [System.Environment]::GetEnvironmentVariable("NEXTAUTH_URL", "User")) {
    [System.Environment]::SetEnvironmentVariable("NEXTAUTH_URL", "http://localhost:3000", "User")
    Write-Host "NEXTAUTH_URL establecido a http://localhost:3000" -ForegroundColor Green
}
else {
    Write-Host "NEXTAUTH_URL ya está configurado: $([System.Environment]::GetEnvironmentVariable("NEXTAUTH_URL", "User"))" -ForegroundColor Yellow
}

# Mostrar la configuración actual
Write-Host "`nVariables de entorno configuradas:" -ForegroundColor Cyan
Write-Host "NEXTAUTH_SECRET: [Protegido]" -ForegroundColor Cyan
Write-Host "NEXTAUTH_URL: $([System.Environment]::GetEnvironmentVariable("NEXTAUTH_URL", "User"))" -ForegroundColor Cyan

# Instrucciones para Vercel
Write-Host "`nPara configurar estas variables en Vercel, asegúrate de:" -ForegroundColor Magenta
Write-Host "1. Ir a la configuración del proyecto en Vercel" -ForegroundColor Magenta
Write-Host "2. En la sección 'Environment Variables', agregar:" -ForegroundColor Magenta
Write-Host "   - NEXTAUTH_SECRET (usar un valor secreto generado)"
Write-Host "   - NEXTAUTH_URL (debe ser la URL de tu aplicación desplegada)"
Write-Host "3. Volver a desplegar la aplicación" -ForegroundColor Magenta

Write-Host "`nConfiguración completada" -ForegroundColor Green
