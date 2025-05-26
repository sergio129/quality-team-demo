// Script para diagnosticar problemas con la actualización de proyectos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para diagnosticar problemas con la actualización de un proyecto específico
 */
async function diagnosticarProyecto() {
  try {
    // ID del proyecto problemático
    const idJira = 'BCBH-504';
    const id = '6e60dff5-22f1-4dfb-9e12-583e62761ebb';
    
    console.log(`🔍 Buscando proyecto con idJira: ${idJira} o id: ${id}`);
    
    // Buscar el proyecto por idJira o por ID
    const proyecto = await prisma.project.findFirst({
      where: { 
        OR: [
          { idJira },
          { id }
        ]
      },
      include: {
        team: true,
        cell: true,
        analysts: {
          include: {
            analyst: true
          }
        }
      }
    });
    
    if (!proyecto) {
      console.error(`❌ Proyecto no encontrado con idJira: ${idJira} o id: ${id}`);
      return;
    }
    
    console.log('✅ Proyecto encontrado:');
    console.log({
      id: proyecto.id,
      idJira: proyecto.idJira,
      proyecto: proyecto.proyecto,
      estado: proyecto.estado,
      estadoCalculado: proyecto.estadoCalculado,
      fechaEntrega: proyecto.fechaEntrega,
      fechaCertificacion: proyecto.fechaCertificacion
    });
    
    // Intentar actualizar solo el estado
    console.log('\n🔄 Intentando actualizar solo el estado a "En Progreso"...');
    
    try {
      const resultado = await prisma.project.update({
        where: { id: proyecto.id },
        data: { 
          estado: 'En Progreso',
          estadoCalculado: 'En Progreso'
        }
      });
      
      console.log('✅ Estado actualizado correctamente:');
      console.log({
        id: resultado.id,
        idJira: resultado.idJira,
        estado: resultado.estado,
        estadoCalculado: resultado.estadoCalculado
      });
      
      // Verificar que el estado se actualizó correctamente
      const proyectoActualizado = await prisma.project.findUnique({
        where: { id: proyecto.id }
      });
      
      console.log('\n🔍 Verificando estado actual:');
      console.log({
        estado: proyectoActualizado.estado,
        estadoCalculado: proyectoActualizado.estadoCalculado
      });
      
    } catch (error) {
      console.error('❌ Error al actualizar el estado:', error);
    }
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el diagnóstico
diagnosticarProyecto()
  .catch(e => {
    console.error('Error no controlado:', e);
    process.exit(1);
  });
