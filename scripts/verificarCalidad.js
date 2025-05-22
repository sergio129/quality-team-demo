// Este script verifica el cálculo de calidad para el plan SRCA-6548
const fs = require('fs');
const path = require('path');

// Cargar los datos
const testCasesPath = path.join(__dirname, '..', 'data', 'test-cases.txt');
const testPlansPath = path.join(__dirname, '..', 'data', 'test-plans.txt');

// Función principal
async function verificarCalidad() {
  try {
    console.log('Verificando cálculo de calidad...');
    
    // Cargar los datos
    const testCasesData = await fs.promises.readFile(testCasesPath, 'utf8');
    const testPlansData = await fs.promises.readFile(testPlansPath, 'utf8');
    
    const testCases = JSON.parse(testCasesData);
    const testPlans = JSON.parse(testPlansData);
    
    // Buscar el plan específico
    const targetPlanId = '1f1efbe6-9c90-4ab0-b9a5-668db9218a1b'; // ID del plan SRCA-6548
    const plan = testPlans.find(p => p.id === targetPlanId);
    
    if (!plan) {
      console.log('Plan no encontrado');
      return;
    }
    
    console.log(`Analizando plan: ${plan.projectId}`);
    
    // Encontrar casos asociados a este plan
    const casesForPlan = testCases.filter(tc => tc.testPlanId === plan.id);
    console.log(`Total de casos: ${casesForPlan.length}`);
    
    // Contar defectos
    const totalDefects = casesForPlan.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
    console.log(`Total de defectos: ${totalDefects}`);
    
    // Calcular calidad con la fórmula: 100 - (totalDefectos / totalCasosDisenados) * 100
    const calidad = casesForPlan.length > 0 
      ? 100 - (totalDefects / casesForPlan.length) * 100
      : -1;
    
    console.log(`Calidad calculada: ${calidad.toFixed(2)}%`);
    console.log(`Calidad actual en BD: ${plan.testQuality}%`);
    
    // Mostrar detalles de cada caso y sus defectos
    console.log('\nDetalle de casos:');
    casesForPlan.forEach(tc => {
      console.log(`- ${tc.id}: ${tc.name} (${tc.defects?.length || 0} defectos)`);
      if (tc.defects && tc.defects.length > 0) {
        tc.defects.forEach(defect => {
          console.log(`  * Defecto: ${defect}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función
verificarCalidad();
