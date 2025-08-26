// Vamos a crear un pequeño test para la API de proyectos
const fetch = require('node-fetch');

async function testProjectAPI() {
  try {
    console.log('Testing projects API...');
    
    const response = await fetch('http://localhost:3000/api/projects');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('API requires authentication');
      return;
    }
    
    const data = await response.json();
    console.log('Response type:', typeof data);
    console.log('Data keys:', Object.keys(data));
    
    if (data.data && Array.isArray(data.data)) {
      console.log('Total projects:', data.data.length);
      console.log('Sample projects:');
      data.data.slice(0, 3).forEach(p => {
        console.log(`  - ${p.idJira}: ${p.equipo} (${p.estado}/${p.estadoCalculado})`);
      });
    } else if (Array.isArray(data)) {
      console.log('Total projects:', data.length);
      console.log('Sample projects:');
      data.slice(0, 3).forEach(p => {
        console.log(`  - ${p.idJira}: ${p.equipo} (${p.estado}/${p.estadoCalculado})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProjectAPI();
