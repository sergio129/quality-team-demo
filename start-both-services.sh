#!/bin/bash
# Script para iniciar la sincronización automática en Quality Team

echo "🚀 Iniciando Quality Team con sincronización automática..."

# Función para manejar la salida del script
cleanup() {
    echo "🛑 Deteniendo servicios..."
    exit 0
}

# Capturar señales de salida
trap cleanup SIGINT SIGTERM

# Iniciar en paralelo el servidor de desarrollo y el file watcher
echo "🌐 Iniciando servidor de desarrollo..."
npm run dev &
DEV_PID=$!

echo "🔍 Iniciando sincronización automática..."
npm run watch-sync &
SYNC_PID=$!

echo "✅ Servicios iniciados exitosamente"
echo "   - Servidor de desarrollo: PID $DEV_PID"
echo "   - Sincronización automática: PID $SYNC_PID"
echo ""
echo "💡 Para sincronizar manualmente: npm run sync-data"
echo "❌ Para detener: Ctrl+C"
echo ""

# Esperar a que los procesos terminen
wait
