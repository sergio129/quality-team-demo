// run-sonar-analysis.js
const scanner = require('sonarqube-scanner');

// Obtener token de las variables de entorno o usar el predeterminado
const sonarToken = process.env.SONAR_TOKEN || 'TU_TOKEN_GENERADO';

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
  () => process.exit()
);
