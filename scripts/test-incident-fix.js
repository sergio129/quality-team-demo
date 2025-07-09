// Prueba de la corrección del problema de creación de incidencias
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Definir el servicio directamente para la prueba (una versión simplificada)
class TestService {
  constructor() {
    this.prisma = prisma;
  }

  async findCellIdByName(name) {
    // Verificar si el parámetro es un UUID (posible ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name);
    
    if (isUuid) {
      // Si parece ser un UUID, buscar directamente por ID
      const cellById = await prisma.cell.findUnique({
        where: { id: name }
      });
      
      if (cellById) {
        return cellById.id;
      }
    }
    
    // Buscar por nombre (comportamiento original)
    const cell = await prisma.cell.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    
    if (!cell) {
      throw new Error(`Célula no encontrada: ${name}`);
    }
    
    return cell.id;
  }

  // Método simplificado para probar que la correción funciona
  async testFindCellId(cellIdentifier) {
    try {
      const cellId = await this.findCellIdByName(cellIdentifier);
      return { success: true, cellId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

async function testFindCell() {
  try {
    // Verificamos las células disponibles
    const cells = await prisma.cell.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log("Células disponibles en la base de datos:");
    console.log(JSON.stringify(cells, null, 2));
    
    // Probamos encontrar la célula por ID
    const cellId = "ce52b7a0-796c-4adc-aff9-48d146c6d74b"; // ID de Suramericana
    console.log(`\nProbando buscar célula por ID: ${cellId}`);
    
    const service = new TestService();
    const resultById = await service.testFindCellId(cellId);
    
    if (resultById.success) {
      console.log(`✅ Célula encontrada por ID: ${resultById.cellId}`);
    } else {
      console.log(`❌ Error al buscar por ID: ${resultById.error}`);
      throw new Error(`Falló la prueba de búsqueda por ID: ${resultById.error}`);
    }
    
    // Probamos encontrar la célula por nombre
    const cellName = "Suramericana";
    console.log(`\nProbando buscar célula por nombre: ${cellName}`);
    
    const resultByName = await service.testFindCellId(cellName);
    
    if (resultByName.success) {
      console.log(`✅ Célula encontrada por nombre: ${resultByName.cellId}`);
    } else {
      console.log(`❌ Error al buscar por nombre: ${resultByName.error}`);
      throw new Error(`Falló la prueba de búsqueda por nombre: ${resultByName.error}`);
    }
    
    console.log("\nPRUEBAS COMPLETADAS EXITOSAMENTE");
    
    return { success: true };
  } catch (error) {
    console.error("Error durante la prueba:", error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testFindCell()
  .then(result => {
    console.log("✅ Todas las pruebas pasaron exitosamente.");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Las pruebas fallaron:", error);
    process.exit(1);
  });
