// Script para verificar las células existentes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cells = await prisma.cell.findMany();
    console.log('Células encontradas:');
    console.log(JSON.stringify(cells, null, 2));
    
    // También comprobemos la célula específica mencionada en el error
    const specificCell = await prisma.cell.findFirst({
      where: {
        id: 'ce52b7a0-796c-4adc-aff9-48d146c6d74b'
      }
    });
    
    console.log('Célula específica:');
    console.log(JSON.stringify(specificCell, null, 2));
    
    // Busquemos todas las células disponibles para comparar con las opciones del formulario
    const cellNames = await prisma.cell.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('Nombres de células disponibles:');
    console.log(JSON.stringify(cellNames, null, 2));
    
  } catch (error) {
    console.error('Error al consultar células:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
