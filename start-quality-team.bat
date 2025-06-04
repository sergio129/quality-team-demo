@echo off
echo ========================================
echo 🚀 QUALITY TEAM - SCRIPT DE INICIO
echo ========================================
echo 📅 Fecha: %date% %time%
echo.

echo 📂 Verificando directorio actual...
cd /d "e:\Proyectos\quality-team"
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se pudo acceder al directorio del proyecto
    pause
    exit /b 1
)
echo ✅ Directorio: %cd%
echo.

echo 🔍 Verificando archivos esenciales...
if not exist "package.json" (
    echo ❌ ERROR: package.json no encontrado
    pause
    exit /b 1
)
if not exist "next.config.ts" (
    echo ❌ ERROR: next.config.ts no encontrado
    pause
    exit /b 1
)
if not exist ".env" (
    echo ⚠️  ADVERTENCIA: archivo .env no encontrado
) else (
    echo ✅ Archivo .env encontrado
)
echo ✅ Archivos esenciales verificados
echo.

echo 🔧 Verificando herramientas...
echo 🔍 Verificando Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en PATH
    echo 👋 Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
)
echo ✅ Node.js disponible

echo 🔍 Verificando npm...
echo DEBUG: Saltando verificación detallada de npm...
echo ✅ npm disponible (asumido)
echo DEBUG: Continuando después de verificar npm...
echo.

echo 🧹 Verificando puerto 3000...
netstat -ano | findstr :3000 >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  ADVERTENCIA: Puerto 3000 ya está en uso
    echo 🛑 Terminando procesos Node.js existentes...
    taskkill /f /im node.exe >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Procesos Node.js terminados
    ) else (
        echo ℹ️  No se encontraron procesos Node.js para terminar
    )
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Puerto 3000 disponible
)
echo.

echo 📦 Verificando dependencias...
if not exist "node_modules" (
    echo ⚠️  node_modules no existe, instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules existe
)
echo.

echo 🗄️  Verificando Prisma Client...
if not exist "node_modules\.prisma\client" (
    echo ⚠️  Prisma Client no generado, generando...
    npx prisma generate
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la generación de Prisma Client
        pause
        exit /b 1
    )
) else (
    echo ✅ Prisma Client existe
)
echo.

echo 🚀 Iniciando Quality Team...
echo 🌐 Iniciando servidor de desarrollo Next.js...
echo ⏱️  Tiempo de inicio: %time%
echo.

echo 🔍 Verificando script 'dev' en package.json...
findstr /C:"\"dev\"" package.json >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Script 'dev' no encontrado en package.json
    echo 👋 Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
) else (
    echo ✅ Script 'dev' encontrado
)

echo.
echo ========================================
echo           INICIANDO SERVIDOR
echo ========================================
echo 🔍 Ejecutando: npm run dev
echo ⏳ Servidor iniciando...
echo.

npm run dev

echo.
echo ========================================
echo ⏱️  El servidor se detuvo a las: %time%
echo 💡 Código de salida: %errorlevel%

if %errorlevel% neq 0 (
    echo ❌ ERROR: El servidor falló al iniciar
    echo 🔍 Posibles causas:
    echo    - Puerto 3000 ocupado
    echo    - Error en configuración
    echo    - Dependencias faltantes
    echo    - Problema con base de datos
    echo.    echo 🛠️  Diagnóstico rápido:
    echo ----------------------------------------
    echo 📦 Next.js:
    npx next --version 2>nul || echo ❌ Next.js no disponible
    echo 🔌 Puerto 3000:
    netstat -ano | findstr :3000 2>nul && echo ⚠️ Puerto ocupado || echo ✅ Puerto libre
    echo 🗄️  Prisma:
    npx prisma --version 2>nul || echo ❌ Prisma no disponible
    echo.
) else (
    echo ✅ El servidor se cerró normalmente
)

echo ========================================
echo 👋 Presiona cualquier tecla para salir...
pause >nul
