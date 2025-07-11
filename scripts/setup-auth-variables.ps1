# setup-auth-variables.ps1
# Script para configurar variables de entorno para NextAuth

Write-Host "CONFIGURACIÓN DE AUTENTICACIÓN PARA QUALITY TEAM" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Generar un secret seguro para NEXTAUTH_SECRET
$randomBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($randomBytes)
$secret = [Convert]::ToBase64String($randomBytes)

Write-Host "1. CONFIGURA LAS SIGUIENTES VARIABLES EN VERCEL:" -ForegroundColor Cyan
Write-Host "   ---------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "   NEXTAUTH_SECRET" -ForegroundColor Yellow
Write-Host "   Copia este valor:" -ForegroundColor White
Write-Host "   $secret" -ForegroundColor Green
Write-Host ""
Write-Host "   NEXTAUTH_URL" -ForegroundColor Yellow
Write-Host "   Establece a tu URL en Vercel:" -ForegroundColor White
Write-Host "   https://quality-team.vercel.app" -ForegroundColor Green
Write-Host ""
Write-Host "2. DESPUÉS DE CONFIGURAR LAS VARIABLES:" -ForegroundColor Cyan
Write-Host "   ---------------------------------" -ForegroundColor Cyan
Write-Host "   1. Vuelve a desplegar la aplicación en Vercel (Redeploy)" -ForegroundColor White
Write-Host "   2. Espera unos minutos a que se complete el despliegue" -ForegroundColor White
Write-Host "   3. Prueba el inicio de sesión nuevamente" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: También puedes configurar estas variables para desarrollo local." -ForegroundColor Magenta
Write-Host "¿Deseas configurar las variables para entorno local? (S/N)" -ForegroundColor Yellow

$respuesta = Read-Host
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    [System.Environment]::SetEnvironmentVariable("NEXTAUTH_SECRET", $secret, "User")
    [System.Environment]::SetEnvironmentVariable("NEXTAUTH_URL", "http://localhost:3000", "User")
    Write-Host "`nVariables configuradas localmente." -ForegroundColor Green
    Write-Host "Reinicia tu terminal y VS Code para que los cambios surtan efecto." -ForegroundColor Yellow
}

Write-Host "`nConfiguración completada" -ForegroundColor Green
