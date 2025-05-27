# Aplicar migración para solucionar el problema de creación automática de analistas
# desde el campo 'asignadoA' en incidentes

# Navegar al directorio del proyecto
Set-Location -Path $PSScriptRoot\..

# Verificar que estamos en el directorio correcto
if (-Not (Test-Path -Path ".\prisma\schema.prisma")) {
    Write-Error "No se encontró el archivo schema.prisma. Asegúrate de que estás en el directorio correcto."
    exit 1
}

# Aplicar la migración SQL manualmente
try {
    # Obtener la cadena de conexión de la base de datos desde el archivo .env
    $envContent = Get-Content .env -ErrorAction SilentlyContinue
    $databaseUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "^DATABASE_URL=", "" }

    if ([string]::IsNullOrEmpty($databaseUrl)) {
        Write-Error "No se encontró la variable DATABASE_URL en el archivo .env"
        exit 1
    }
    
    # Ejecutar la migración SQL usando psql
    $migrationFile = ".\prisma\migrations\20240527_add_asignado_a_text.sql"
    $psqlCommand = "psql '$databaseUrl' -f '$migrationFile'"
    
    Write-Host "Aplicando migración SQL..."
    Invoke-Expression $psqlCommand
    
    Write-Host "Generando cliente de Prisma con el esquema actualizado..."
    npx prisma generate

    Write-Host "✅ Migración aplicada correctamente."
} catch {
    Write-Error "Error al aplicar la migración: $_"
    exit 1
}

Write-Host "Ahora el campo 'asignadoA' en incidentes guardará el texto sin crear analistas automáticamente."
