@echo off
cd /d "e:\Proyectos\quality-team"

echo 🚀 Iniciando Quality Team con sincronización automática...

REM Abrir una ventana para el servidor de desarrollo
start "Quality Team - Dev Server" cmd /k "echo 🌐 Iniciando servidor de desarrollo... && npm run dev"

REM Abrir otra ventana para el file watcher
start "Quality Team - Auto Sync" cmd /k "echo 🔍 Iniciando sincronización automática... && npm run watch-sync"

echo ✅ Servicios iniciados:
echo   - Servidor de desarrollo en la primera ventana
echo   - Sincronización automática en la segunda ventana
echo.
echo 💡 Para sincronizar manualmente: npm run sync-data
echo ❌ Para detener: cerrar ambas ventanas o Ctrl+C
pause
