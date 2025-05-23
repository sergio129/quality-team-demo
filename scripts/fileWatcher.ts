import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

class FileWatcher {
  private isProcessing = false;
  private lastSyncTime = 0;
  private debounceMs = 2000; // Esperar 2 segundos antes de sincronizar

  private filesToWatch = [
    'data/seguimiento.txt',
    'data/test-plans.txt',
    // Agregar más archivos según necesites
  ];

  constructor() {
    console.log('🔍 Iniciando File Watcher para sincronización automática...');
    this.initWatcher();
  }

  private initWatcher() {
    const watcher = chokidar.watch(this.filesToWatch, {
      ignored: /(^|[\/\\])\../, // ignorar archivos ocultos
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('change', (filePath) => {
        console.log(`📝 Archivo modificado: ${filePath}`);
        this.handleFileChange(filePath);
      })
      .on('add', (filePath) => {
        console.log(`➕ Nuevo archivo: ${filePath}`);
        this.handleFileChange(filePath);
      })
      .on('unlink', (filePath) => {
        console.log(`❌ Archivo eliminado: ${filePath}`);
        this.handleFileChange(filePath);
      })
      .on('error', (error) => {
        console.error('❗ Error en file watcher:', error);
      });

    console.log(`👀 Monitoreando cambios en:\n${this.filesToWatch.map(f => `  - ${f}`).join('\n')}`);
  }

  private async handleFileChange(filePath: string) {
    const now = Date.now();
    
    // Debouncing: evitar múltiples sincronizaciones seguidas
    if (now - this.lastSyncTime < this.debounceMs) {
      return;
    }

    if (this.isProcessing) {
      console.log('⏳ Sincronización en proceso, esperando...');
      return;
    }

    this.isProcessing = true;
    this.lastSyncTime = now;

    try {
      console.log('🔄 Iniciando sincronización automática...');
      
      const { stdout, stderr } = await execAsync('npm run sync-data', {
        cwd: path.resolve(__dirname, '..')
      });

      if (stdout) {
        console.log('✅ Sincronización completada:');
        console.log(stdout);
      }

      if (stderr && !stderr.includes('warning')) {
        console.error('⚠️ Advertencias/Errores:', stderr);
      }

    } catch (error: any) {
      console.error('❌ Error durante la sincronización:', error.message);
    } finally {
      this.isProcessing = false;
      console.log('🏁 Sincronización finalizada. Monitoreando cambios...\n');
    }
  }

  public stop() {
    console.log('🛑 Deteniendo file watcher...');
    process.exit(0);
  }
}

// Crear e iniciar el watcher
const watcher = new FileWatcher();

// Manejar señales para cerrar limpiamente
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando file watcher...');
  watcher.stop();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando file watcher...');
  watcher.stop();
});

export default FileWatcher;
