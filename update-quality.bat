@echo off
echo Actualizando la calidad de los planes de prueba...
curl -X POST http://localhost:3000/api/test-plans/update-quality
echo.
echo Actualización completada.
pause
