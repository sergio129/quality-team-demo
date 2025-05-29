@echo off
cd /d "e:\Proyectos\quality-team"

echo 🚀 Iniciando Quality Team con sincronización automática...

REM Abrir una ventana para el servidor de desarrollo
start "Quality Team - Dev Server" cmd /k "echo 🌐 Iniciando servidor de desarrollo... && npm run dev"


pause
