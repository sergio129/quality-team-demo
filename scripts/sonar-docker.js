// Configuración de SonarQube con Docker
const { execSync } = require('child_process');
const scanner = require('sonarqube-scanner');

console.log('🚀 Iniciando análisis de SonarQube con Docker');

try {
  // Verificar si el contenedor ya existe y está en ejecución
  console.log('👉 Verificando estado de Docker...');
  let containerRunning = false;
  
  try {
    const containerStatus = execSync('docker ps -q -f name=sonarqube').toString().trim();
    containerRunning = containerStatus !== '';
  } catch (error) {
    console.log('❌ Docker no parece estar en funcionamiento o no está instalado.');
    console.log('Por favor, asegúrese de que Docker esté instalado y funcionando.');
    process.exit(1);
  }

  if (!containerRunning) {
    console.log('👉 Verificando si existe un contenedor sonarqube detenido...');
    const stoppedContainer = execSync('docker ps -aq -f name=sonarqube').toString().trim();
    
    if (stoppedContainer) {
      console.log('🔄 Eliminando el contenedor sonarqube existente...');
      execSync('docker rm -f sonarqube');
    }
    
    console.log('🐳 Iniciando contenedor de SonarQube...');
    execSync('docker run -d --name sonarqube -p 9000:9000 sonarqube:latest');
    console.log('⏳ Esperando a que SonarQube esté disponible...');
    
    // Esperamos a que SonarQube esté listo para aceptar conexiones
    console.log('⌛ Este proceso puede tardar hasta 2 minutos. Por favor, espere...');
    let ready = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 intentos con 5 segundos de espera = 2.5 minutos máximo

    while (!ready && attempts < maxAttempts) {
      try {
        // Intentar obtener el estado del servidor
        execSync('curl -s -f http://localhost:9000/api/system/status');
        ready = true;
        console.log('✅ SonarQube está listo para usar');
      } catch (e) {
        process.stdout.write('.');
        attempts++;
        // Esperar 5 segundos antes del siguiente intento
        execSync('powershell -Command "Start-Sleep -s 5"');
      }
    }
    
    if (!ready) {
      console.log('\n❌ SonarQube no respondió en el tiempo esperado.');
      console.log('Por favor, verifique manualmente el estado accediendo a http://localhost:9000');
      console.log('Intente ejecutar el análisis más tarde usando "npm run sonar:docker"');
      process.exit(1);
    }
    
    console.log('\n📝 Información importante:');
    console.log('1. El usuario predeterminado es "admin" y la contraseña es "admin"');
    console.log('2. Se le pedirá cambiar la contraseña en el primer inicio de sesión');
    console.log('3. Acceda a http://localhost:9000 para ver la interfaz web de SonarQube');
    console.log('4. Para generar un token, vaya a su cuenta > Mi Cuenta > Tokens de seguridad');
  } else {
    console.log('✅ El contenedor SonarQube ya está en ejecución');
  }

  // Esperar un poco más para asegurar que el servicio esté completamente listo
  console.log('⏳ Esperando un momento adicional para asegurar que el servicio esté estable...');
  execSync('powershell -Command "Start-Sleep -s 10"');
  
  // Obtener token de las variables de entorno o usar el predeterminado
  const sonarToken = process.env.SONAR_TOKEN || 'TU_TOKEN_GENERADO';
  
  console.log('🔍 Iniciando análisis del código fuente...');
  
  scanner(
    {
      serverUrl: 'http://localhost:9000',
      token: sonarToken,
      options: {
        'sonar.projectKey': 'quality-team',
        'sonar.projectName': 'Quality Team',
        'sonar.projectVersion': '1.0.0',
        'sonar.sources': 'src',
        'sonar.exclusions': '**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/node_modules/**,**/.next/**',
        'sonar.tests': 'src',
        'sonar.test.inclusions': '**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx',
        'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
        'sonar.sourceEncoding': 'UTF-8',
        'sonar.typescript.tsconfigPath': 'tsconfig.json',
        'sonar.qualitygate.wait': 'true'
      }
    },
    () => {
      console.log('✅ Análisis completado. Revise los resultados en http://localhost:9000');
      process.exit();
    }
  );

} catch (error) {
  console.error('❌ Error durante el proceso:', error.message);
  process.exit(1);
}
