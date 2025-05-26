// Configuración mejorada de SonarQube con Docker Compose
const { execSync } = require('child_process');
const scanner = require('sonarqube-scanner');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando análisis de SonarQube con Docker Compose');
console.log('==========================================');

try {
  // Verificar que existe docker-compose
  console.log('👉 Verificando Docker Compose...');
  try {
    execSync('docker-compose --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Docker Compose no está instalado o accesible.');
    console.log('Por favor, asegúrese de que Docker Desktop esté instalado con soporte para Docker Compose.');
    process.exit(1);
  }

  // Verificar si docker-compose-sonar.yml existe
  const composePath = path.join(process.cwd(), 'docker-compose-sonar.yml');
  if (!fs.existsSync(composePath)) {
    console.log('❌ No se encontró el archivo docker-compose-sonar.yml');
    console.log('Asegúrese de que el archivo exista en la raíz del proyecto.');
    process.exit(1);
  }

  // Verificar si los servicios ya están en funcionamiento
  console.log('👉 Verificando estado de los servicios...');
  let servicesRunning = false;
  
  try {
    const sonarqubeStatus = execSync('docker ps -q -f name=quality-team-sonarqube').toString().trim();
    servicesRunning = sonarqubeStatus !== '';
  } catch (error) {
    console.log('❌ No se pudo verificar el estado de Docker.');
    console.log('Por favor, asegúrese de que Docker esté en ejecución.');
    process.exit(1);
  }

  // Iniciar o verificar los servicios
  if (!servicesRunning) {
    console.log('👉 Los servicios de SonarQube no están en ejecución.');
    console.log('🐳 Iniciando servicios con Docker Compose...');
    
    try {
      // Detener y eliminar contenedores anteriores si existieran
      execSync('docker-compose -f docker-compose-sonar.yml down', { stdio: 'inherit' });
      
      // Iniciar los servicios
      execSync('docker-compose -f docker-compose-sonar.yml up -d', { stdio: 'inherit' });
      
      console.log('✅ Servicios iniciados correctamente');
      console.log('⏳ Esperando a que SonarQube esté disponible...');
      console.log('⌛ Este proceso puede tardar hasta 2 minutos. Por favor, espere...');
      
      // Esperar a que SonarQube esté listo
      let ready = false;
      let attempts = 0;
      const maxAttempts = 36; // 36 intentos con 5 segundos = 3 minutos máximo
      
      while (!ready && attempts < maxAttempts) {
        try {
          // Intentar obtener el estado del servidor
          const result = execSync('curl -s -f http://localhost:9000/api/system/status').toString();
          if (result.includes('STARTING')) {
            process.stdout.write('S'); // Indica que está comenzando
          } else {
            ready = true;
            console.log('\n✅ SonarQube está listo para usar');
          }
        } catch (e) {
          // Mostrar diferentes caracteres para indicar progreso
          if (attempts % 4 === 0) process.stdout.write('.');
          else if (attempts % 4 === 1) process.stdout.write('o');
          else if (attempts % 4 === 2) process.stdout.write('O');
          else process.stdout.write('o');
          
          attempts++;
          // Esperar antes del siguiente intento
          execSync(process.platform === 'win32' 
            ? 'powershell -Command "Start-Sleep -s 5"' 
            : 'sleep 5');
        }
      }
      
      if (!ready) {
        console.log('\n⚠️ SonarQube está tardando más de lo esperado en iniciar.');
        console.log('Puede continuar con el análisis, pero verifique manualmente en http://localhost:9000');
      }
      
      console.log('\n📝 Información de SonarQube:');
      console.log('1. URL: http://localhost:9000');
      console.log('2. Usuario por defecto: admin');
      console.log('3. Contraseña por defecto: admin');
      console.log('4. Se pedirá cambiar la contraseña en el primer inicio de sesión');
    } catch (dockerError) {
      console.error('❌ Error al iniciar los servicios:', dockerError.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Los servicios de SonarQube ya están en ejecución');
  }

  // Dar tiempo adicional para estabilidad
  console.log('⏳ Espera adicional para garantizar que el servicio esté estable...');
  execSync(process.platform === 'win32' 
    ? 'powershell -Command "Start-Sleep -s 10"' 
    : 'sleep 10');
  
  // Ejecutar el análisis de SonarQube
  console.log('\n🔍 Iniciando análisis del código fuente...');
  
  // Obtener token de las variables de entorno o usar el predeterminado
  const sonarToken = process.env.SONAR_TOKEN || '';
  const tokenMessage = sonarToken 
    ? 'Usando token de autenticación proporcionado' 
    : 'No se proporcionó token de autenticación. Usando credenciales por defecto.';
  console.log(tokenMessage);
  
  // Ejecutar el scanner
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
      console.log('✅ Análisis completado correctamente');
      console.log('🌐 Acceda a los resultados en http://localhost:9000/dashboard?id=quality-team');
      process.exit();
    }
  );

} catch (error) {
  console.error('❌ Error durante el proceso:', error.message);
  process.exit(1);
}
